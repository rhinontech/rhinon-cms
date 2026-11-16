#!/usr/bin/env bash
#
# One-off Postgres tuning for the production box: a t4g.medium (2 vCPU ARM, 4 GB RAM) that
# also runs Node (prod + beta), nginx and coturn. Run it ON the server, once:
#
#   sudo bash rhinontech/backend/scripts/pg-tune.sh
#   DRY_RUN=1 bash rhinontech/backend/scripts/pg-tune.sh      # prints the plan, changes nothing
#
# Every setting was still at its stock default except shared_buffers (128 MB, also the stock
# value). What changes, and why:
#
#   shared_buffers        128MB -> 512MB   a quarter of RAM is the usual starting point; Node
#                                          holds ~1.1 GB, so no more than that. Needs a restart.
#   effective_cache_size  4GB   -> 2GB     planner hint only. 4 GB was the whole machine; the
#                                          OS page cache really gets ~1.5-2 GB.
#   work_mem              4MB   -> 8MB     fewer sorts/hashes spilling to disk in the CRM/leads
#                                          queries (pool is 10 per app, so worst case is bounded).
#   maintenance_work_mem  64MB  -> 128MB   faster VACUUM and index builds.
#   random_page_cost      4     -> 1.1     the default assumes spinning disks; this is EBS SSD.
#                                          At 4 the planner talks itself out of index scans.
#   jit                   on    -> off     JIT compiles a query before running it, which costs
#                                          more than it saves on short OLTP queries.
#   pg_stat_statements    (new)            per-query timings. Until now the only way to find a
#                                          slow query was guessing. Needs a restart (preload).
#   log_min_duration_statement  500        statements slower than 500 ms go to the Postgres log.
#
# The restart takes a few seconds; the API reconnects on its own and the deploy's pm2 restart
# also resets its pool, so run this just before deploying. It is safe to re-run.
#
# Roll back:  sudo rm /etc/postgresql/18/main/conf.d/90-rhinon-tuning.conf \
#               && sudo systemctl restart postgresql@18-main
# Afterwards, the slowest queries:
#   sudo -u postgres psql -d rhinontech -c "select calls, round(total_exec_time) total_ms,
#     round(mean_exec_time::numeric,1) mean_ms, left(query,90) q
#     from pg_stat_statements order by total_exec_time desc limit 15"

set -euo pipefail

PGVER="${PGVER:-18}"
CLUSTER="${CLUSTER:-main}"
CONF_DIR="${PG_CONF_DIR:-/etc/postgresql/$PGVER/$CLUSTER/conf.d}"
CONF_FILE="$CONF_DIR/90-rhinon-tuning.conf"
UNIT="postgresql@$PGVER-$CLUSTER"
DATABASES=("rhinontech" "rhinontech-beta")
DRY="${DRY_RUN:-0}"

say() { echo ""; echo "▸ $1"; }
psql_admin() { sudo -u postgres psql -X -qAt "$@"; }

read -r -d '' NEW_CONF <<'EOF' || true
# Managed by rhinontech/backend/scripts/pg-tune.sh — see that file for the why.
shared_buffers = 512MB
effective_cache_size = 2GB
work_mem = 8MB
maintenance_work_mem = 128MB
random_page_cost = 1.1
jit = off
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = top
log_min_duration_statement = 500
EOF

if [ "$DRY" = "1" ]; then
  say "DRY RUN — nothing will be changed"
  echo "would write $CONF_FILE:"
  echo "$NEW_CONF" | sed 's/^/    /'
  echo "would validate it with pg_file_settings, restart $UNIT, then run in each of: ${DATABASES[*]}"
  echo "    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"
  exit 0
fi

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo (it writes to /etc/postgresql and restarts Postgres)."; exit 1; }
[ -d "$CONF_DIR" ] || { echo "No $CONF_DIR — is this the right server / Postgres version? (PGVER=$PGVER CLUSTER=$CLUSTER)"; exit 1; }
grep -q "^include_dir *= *'conf.d'" "/etc/postgresql/$PGVER/$CLUSTER/postgresql.conf" \
  || { echo "postgresql.conf does not include conf.d; refusing to guess where to put settings."; exit 1; }

say "Current values"
for s in shared_buffers effective_cache_size work_mem random_page_cost jit shared_preload_libraries; do
  printf '    %-26s %s\n' "$s" "$(psql_admin -c "show $s")"
done

say "Writing $CONF_FILE"
BACKUP=""
if [ -f "$CONF_FILE" ]; then BACKUP="$CONF_FILE.bak.$(date +%s)"; cp "$CONF_FILE" "$BACKUP"; fi
printf '%s\n' "$NEW_CONF" > "$CONF_FILE"
chown postgres:postgres "$CONF_FILE"; chmod 644 "$CONF_FILE"

# pg_file_settings re-reads the config files when queried, so a typo is caught here, before
# anything restarts. Roll the file back rather than leave a config Postgres cannot start on.
say "Validating"
BAD="$(psql_admin -c "select name || ' = ' || coalesce(setting,'?') || '  ->  ' || error from pg_file_settings where error is not null")"
if [ -n "$BAD" ]; then
  echo "Postgres rejected the new settings:"; echo "$BAD" | sed 's/^/    /'
  if [ -n "$BACKUP" ]; then mv "$BACKUP" "$CONF_FILE"; else rm -f "$CONF_FILE"; fi
  echo "Rolled back. Nothing was restarted."
  exit 1
fi
echo "    all settings parsed"

say "Restarting $UNIT (a few seconds of no database)"
systemctl restart "$UNIT"
for i in $(seq 1 30); do
  if pg_isready -q -h /var/run/postgresql; then echo "    ready after ${i}s"; break; fi
  [ "$i" -eq 30 ] && { echo "Postgres did not come back in 30 s — check: journalctl -u $UNIT -n 50"; exit 1; }
  sleep 1
done

say "Enabling pg_stat_statements"
for db in "${DATABASES[@]}"; do
  if [ "$(psql_admin -c "select 1 from pg_database where datname = '$db'")" = "1" ]; then
    psql_admin -d "$db" -c "create extension if not exists pg_stat_statements" >/dev/null && echo "    $db: enabled"
  else
    echo "    $db: no such database, skipped"
  fi
done

say "New values"
for s in shared_buffers effective_cache_size work_mem random_page_cost jit shared_preload_libraries; do
  printf '    %-26s %s\n' "$s" "$(psql_admin -c "show $s")"
done
echo ""
echo "Done. Roll back with: sudo rm $CONF_FILE && sudo systemctl restart $UNIT"
