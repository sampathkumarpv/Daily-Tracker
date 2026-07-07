#!/bin/bash

# Add Homebrew to PATH (works for both Apple Silicon and Intel Macs)
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# ─────────────────────────────────────────────
# 1. Find which postgresql formula is installed
# ─────────────────────────────────────────────
PG_SERVICE=$(brew list --formula 2>/dev/null | grep -E "^postgresql(@[0-9]+)?$" | head -1)

# ─────────────────────────────────────────────
# 2. Install if not found
# ─────────────────────────────────────────────
if [ -z "$PG_SERVICE" ]; then
  echo "📦 [DB] PostgreSQL not found. Installing via Homebrew..."
  brew install postgresql@16
  PG_SERVICE="postgresql@16"
  echo "✅ [DB] PostgreSQL installed."
else
  echo "✅ [DB] PostgreSQL found: $PG_SERVICE"
fi

# ─────────────────────────────────────────────
# 3. Start if not already running
# ─────────────────────────────────────────────
if brew services list | grep -qE "^$PG_SERVICE\s+started"; then
  echo "✅ [DB] PostgreSQL ($PG_SERVICE) is already running. Skipping start."
else
  echo "🚀 [DB] Starting PostgreSQL ($PG_SERVICE)..."
  brew services start "$PG_SERVICE"
  # Give it a moment to be ready
  sleep 3
  echo "✅ [DB] PostgreSQL started."
fi

# ─────────────────────────────────────────────
# 4. Ensure taskflow user + database exist
# ─────────────────────────────────────────────
echo "🔧 [DB] Ensuring taskflow user and database exist..."

psql postgres -c "CREATE USER taskflow WITH PASSWORD 'taskflow_pass';" 2>/dev/null \
  && echo "✅ [DB] User 'taskflow' created." \
  || echo "ℹ️  [DB] User 'taskflow' already exists."

psql postgres -c "CREATE DATABASE taskflow OWNER taskflow;" 2>/dev/null \
  && echo "✅ [DB] Database 'taskflow' created." \
  || echo "ℹ️  [DB] Database 'taskflow' already exists."

echo "🟢 [DB] PostgreSQL is ready at localhost:5432"
