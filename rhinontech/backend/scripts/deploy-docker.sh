#!/usr/bin/env bash
#
# Docker-compose deploy, run on the EC2 box by POST /deploy/:target for `kind: "docker"`
# targets. Same contract as deploy.sh: copied to /tmp before running, spawned detached,
# streams to $LOG, and the EXIT trap writing $EXIT_FILE is the only completion signal.
#
# Deliberately does NOT rebuild the image. FurrCircle's compose bind-mounts the source
# (`.:/app`) and its entrypoint runs `npm install` + `sequelize-cli db:migrate` on every
# container start, so a restart already picks up pulled code, new deps and new migrations.
# A `--build` would re-run npm install inside a Docker build on a 1GB box with ~90MB free,
# for an image layer the bind mount immediately masks. If the Dockerfile itself changes
# this script says so and stops, rather than half-deploying.
#
# Required env: REPO BRANCH COMPOSE_DIR SERVICE PORT HEALTH_PATH LOG EXIT_FILE META_FILE

set -uo pipefail

mkdir -p "$(dirname "$LOG")"
exec >>"$LOG" 2>&1

STEP="starting"
finish() {
  local code=$?
  if [ "$code" -ne 0 ]; then
    echo ""
    echo "=== FAILED during: $STEP (exit $code) ==="
  fi
  echo "$code" >"$EXIT_FILE"
}
trap finish EXIT

say() { echo ""; echo "▸ $1"; STEP="$1"; }
die() { echo "$1"; exit 1; }

echo "=== Deploy $SERVICE (docker, $BRANCH) — $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="
echo "repo:    $REPO"
echo "compose: $COMPOSE_DIR"

cd "$REPO" || die "repo not found: $REPO"
command -v docker >/dev/null 2>&1 || die "docker not on PATH"
docker compose version >/dev/null 2>&1 || die "docker compose v2 plugin unavailable"

BEFORE=$(git rev-parse HEAD)
echo "commit before: $BEFORE"

say "git pull (origin/$BRANCH)"
git fetch origin "$BRANCH" || exit $?
git checkout "$BRANCH" || exit $?
git pull --ff-only origin "$BRANCH" || exit $?

AFTER=$(git rev-parse HEAD)
SUBJECT=$(git log -1 --pretty=%s)
echo "commit after:  $AFTER"
echo "               $SUBJECT"

{
  echo "before=$BEFORE"
  echo "after=$AFTER"
  echo "message=$SUBJECT"
} >"$META_FILE" 2>/dev/null || true

STEP="image-config check"
cd "$COMPOSE_DIR" || die "compose dir missing: $COMPOSE_DIR"

# A changed Dockerfile can't take effect through a restart. Stop rather than pretend the
# deploy shipped it — rebuilding is a manual, memory-hungry step on this box.
if ! git diff --quiet "$BEFORE" "$AFTER" -- Dockerfile docker-compose.yml 2>/dev/null; then
  echo ""
  echo "Dockerfile or docker-compose.yml changed in this pull."
  echo "A restart cannot apply those — rebuild by hand when the box is quiet:"
  echo "    cd $COMPOSE_DIR && docker compose up -d --build $SERVICE"
  die "stopping before restart so the running container is left untouched"
fi

say "docker compose restart $SERVICE"
# restart re-runs the entrypoint: npm install, then db:migrate, then the server.
docker compose restart "$SERVICE" || exit $?

say "health check :$PORT$HEALTH_PATH"
# Migrations run on boot, so this is slower than a pm2 restart — allow 90s.
for i in $(seq 1 90); do
  if curl -fsS --max-time 3 "http://localhost:$PORT$HEALTH_PATH" >/dev/null 2>&1; then
    echo "healthy after ${i}s"
    echo ""
    docker compose ps "$SERVICE"
    echo ""
    echo "=== SUCCESS — $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="
    exit 0
  fi
  sleep 1
done

echo ""
echo "--- last 40 lines of container log ---"
docker compose logs --tail 40 "$SERVICE" 2>&1
die "did not pass health check within 90s"
