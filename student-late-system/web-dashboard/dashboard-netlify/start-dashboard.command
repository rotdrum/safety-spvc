#!/bin/bash
set -e

cd "$(dirname "$0")"

PORT=8788
while lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

echo "Starting Student Late Dashboard on http://127.0.0.1:${PORT}/"
echo "Close this window to stop the dashboard server."

python3 -m http.server "${PORT}" > /tmp/student-late-dashboard.log 2>&1 &
SERVER_PID=$!

sleep 1
open "http://127.0.0.1:${PORT}/"

wait "${SERVER_PID}"
