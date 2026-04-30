#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB="${SCRIPT_DIR}/events.db"

rm -f "$DB"

echo "==> Building schema  ($SCRIPT_DIR/schema.sql)"
sqlite3 "$DB" < "$SCRIPT_DIR/schema.sql"

echo "==> Seeding data     ($SCRIPT_DIR/seed.sql)"
sqlite3 "$DB" < "$SCRIPT_DIR/seed.sql"

echo
echo "==> Running demo queries (database/queries.sql)"
echo "    Each statement is echoed before its result."
echo
sqlite3 -header -column -echo "$DB" < "$SCRIPT_DIR/queries.sql"

echo
echo "==> Database ready at: $DB"
echo "    Open an interactive shell with:  sqlite3 $DB"
