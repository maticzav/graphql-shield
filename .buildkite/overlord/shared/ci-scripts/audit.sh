#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Usage: $(basename $0) <path-to-compose-file>"
  exit 1
fi

set -e

COMPOSE_FILE=$1

if [ ! -f $COMPOSE_FILE ]; then
  echo "Error: ${COMPOSE_FILE} is not a file"
  exit 1
fi

MODULE_DIR=$(dirname $COMPOSE_FILE)
pushd "$MODULE_DIR"

# default audit command
audit_command="npm audit"

if [ -f ./package.json ]; then
  audit=$(jq -r '.scripts.audit' ./package.json)

  if [ "$audit" != "null" ]; then
    audit_command="npm run audit"
  fi
else
  audit_command="npm run audit"
fi

MODULE=$(basename "$PWD")
popd

set +e

echo "--- $(date '+%H:%M:%S') :docker: docker compose pull $MODULE"

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "runtime" pull $MODULE

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "runtime" \
  run --rm \
  -e BUILDKITE \
  -e BUILDKITE_TAG \
  -e BUILDKITE_BRANCH \
  -e BUILDKITE_COMMIT \
  -e BUILDKITE_PIPELINE_SLUG \
  $MODULE \
  bash -c "set -e; echo \"+++ \$(date '+%H:%M:%S') :lock: audit\" && ${audit_command}"

if [ $? -ne 0 ]; then
  exit 3
fi
