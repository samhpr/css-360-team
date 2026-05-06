#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB="${SCRIPT_DIR}/events.db"

rm -f "$DB"
sqlite3 "$DB" < "$SCRIPT_DIR/schema.sql"
sqlite3 "$DB" < "$SCRIPT_DIR/seed.sql"

echo "events.db ready. open with:  sqlite3 $DB"
