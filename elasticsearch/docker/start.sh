#!/bin/sh
set -eu

ES_WAIT_URL="${ES_URL:-http://elasticsearch:9200}"
ES_STARTUP_TIMEOUT="${ES_STARTUP_TIMEOUT:-90}"

echo "[bootstrap] Waiting for Elasticsearch at ${ES_WAIT_URL}"

start_ts="$(date +%s)"
while true; do
  if wget -q -O /dev/null "${ES_WAIT_URL}"; then
    break
  fi

  now_ts="$(date +%s)"
  if [ $((now_ts - start_ts)) -ge "${ES_STARTUP_TIMEOUT}" ]; then
    echo "[bootstrap] Elasticsearch did not become ready within ${ES_STARTUP_TIMEOUT}s"
    exit 1
  fi

  sleep 2
done

echo "[bootstrap] Elasticsearch is reachable"
echo "[bootstrap] Ensuring index exists"
node dist/elastic/createIndices.js

echo "[bootstrap] Starting API server"
exec node dist/index.js
