#!/usr/bin/env bash
#
# Chat widget release, run on the EC2 box by POST /deploy/widget.
#
# Pulls the branch, builds bot-sdk, and publishes @rhinon/chat to npm when
# bot-sdk/package.json carries a version npm doesn't have yet — so releasing is
# "bump the version, push, press Deploy". Nothing is restarted: the hosted
# /widget/rhinon-chat.js is the committed bundle and ships with a backend deploy.
#
# Same contract as deploy.sh: run from a /tmp copy, detached; the EXIT trap
# writing $EXIT_FILE is the only completion signal.
#
# Required env: REPO BRANCH PKG_DIR LOG EXIT_FILE META_FILE NPM_TOKEN

set -uo pipefail

mkdir -p "$(dirname "$LOG")"
exec >>"$LOG" 2>&1

STEP="starting"
NPMRC=""
finish() {
  local code=$?
  [ -n "$NPMRC" ] && rm -f "$NPMRC"
  if [ "$code" -ne 0 ]; then
    echo ""
    echo "=== FAILED during: $STEP (exit $code) ==="
  fi
  echo "$code" >"$EXIT_FILE"
}
trap finish EXIT

say() { echo ""; echo "▸ $1"; STEP="$1"; }
die() { echo "$1"; exit 1; }

echo "=== Widget release ($BRANCH) — $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="

cd "$REPO" || die "repo not found: $REPO"

if ! command -v npm >/dev/null 2>&1; then
  # shellcheck disable=SC1090
  [ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
fi
command -v npm >/dev/null 2>&1 || die "npm not on PATH"
[ -n "${NPM_TOKEN:-}" ] || die "NPM_TOKEN is not set in the backend .env — add an npm Automation token and restart the API once."

BEFORE=$(git rev-parse HEAD)
say "git pull (origin/$BRANCH)"
git fetch origin "$BRANCH" || exit $?
git checkout "$BRANCH" || exit $?
git pull --ff-only origin "$BRANCH" || exit $?
AFTER=$(git rev-parse HEAD)
SUBJECT=$(git log -1 --pretty=%s)
echo "commit: $AFTER"
echo "        $SUBJECT"
{
  echo "before=$BEFORE"
  echo "after=$AFTER"
  echo "message=$SUBJECT"
} >"$META_FILE" 2>/dev/null || true

cd "$PKG_DIR" || die "package dir missing: $PKG_DIR"
NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
echo "package: $NAME@$VERSION"

say "npm ci"
npm ci --no-audit --no-fund || exit $?

# The box has 1 GB of RAM next to the live API; cap the build's heap so it
# leans on swap instead of starving the API.
say "build"
NODE_OPTIONS=--max-old-space-size=768 npm run build || exit $?

say "check the bundle"
test -s dist/rhinon-chat.js || die "dist/rhinon-chat.js is missing"
if grep -qE "localhost:[0-9]+" dist/rhinon-chat.js; then
  die "the bundle contains a localhost URL — refusing to publish"
fi
echo "bundle: $(du -h dist/rhinon-chat.js | cut -f1)"

say "check npm for $NAME@$VERSION"
if npm view "$NAME@$VERSION" version >/dev/null 2>&1; then
  echo "$NAME@$VERSION is already on npm — nothing to publish."
  echo "To release, bump \"version\" in $PKG_DIR/package.json, push, and deploy again."
  echo ""
  echo "=== SUCCESS (built, not published) — $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="
  exit 0
fi

say "npm publish $NAME@$VERSION"
# The token lives in a throwaway npmrc, never in the repo or the log.
NPMRC=$(mktemp)
chmod 600 "$NPMRC"
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >"$NPMRC"
# The build above is what gets published; skip prepublishOnly's second build.
NPM_CONFIG_USERCONFIG="$NPMRC" npm publish --access public --ignore-scripts || exit $?

echo ""
echo "=== SUCCESS — published $NAME@$VERSION — $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="
