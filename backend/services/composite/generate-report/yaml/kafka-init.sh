#!/usr/bin/env bash
set -euo pipefail

BROKER="${KAFKA_BROKER:-kafka:9092}"
TOPIC="${KAFKA_TOPIC:-report-requests}"

echo "Waiting for Kafka at $BROKER ..."
for i in {1..30}; do
  /opt/kafka/bin/kafka-topics.sh --bootstrap-server "$BROKER" --list >/dev/null 2>&1 && break
  sleep 2
done

echo "Creating topic $TOPIC if missing ..."
/opt/kafka/bin/kafka-topics.sh --bootstrap-server "$BROKER" --create --if-not-exists \
  --topic "$TOPIC" --partitions 1 --replication-factor 1 || true

echo "Done."
