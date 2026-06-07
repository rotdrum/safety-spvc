#!/bin/bash
set -e

cd "$(dirname "$0")"

PORT=8080
while lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo "Starting Student Affairs Portal on http://127.0.0.1:${PORT}/"
echo "Close this window to stop the portal server."

python3 -m http.server "${PORT}" --bind 127.0.0.1 > /tmp/student-affairs-portal.log 2>&1 &
SERVER_PID=$!

sleep 1
open "http://127.0.0.1:${PORT}/?v=20260607"

wait "${SERVER_PID}"
