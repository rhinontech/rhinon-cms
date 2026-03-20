#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./scaffold-migration.sh <migration_name>"
  exit 1
fi

NAME="$1"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
FILE="${TIMESTAMP}-${NAME}.js"

mkdir -p src/api/database/migrations

cat > "src/api/database/migrations/${FILE}" <<'EOF'
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // TODO:
      // 1. Add new columns / tables
      // 2. Backfill if needed
      // 3. Add indexes / constraints carefully
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // TODO:
      // Reverse the up migration where feasible
    });
  },
};
EOF

echo "Created migration: src/api/database/migrations/${FILE}"