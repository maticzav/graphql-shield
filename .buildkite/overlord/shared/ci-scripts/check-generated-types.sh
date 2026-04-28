#!/bin/bash

#set -ex

COMPOSE_FILE=$1

if [ ! -f $COMPOSE_FILE ]; then
  echo "Error: ${COMPOSE_FILE} is not a file"
  exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel)

MODULE_DIR=$(dirname $COMPOSE_FILE)
pushd "$MODULE_DIR"
MODULE=$(basename "$PWD")
popd

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "runtime" \
  run --rm \
  -e BUILDKITE \
  -e BUILDKITE_TAG \
  -e BUILDKITE_BRANCH \
  -e BUILDKITE_COMMIT \
  -e BUILDKITE_PIPELINE_SLUG \
  $MODULE \
  bash -c "set -ex; npm ci --no-audit --include-workspace-root; npm run generate-types && git diff --exit-code -- ${MODULE_DIR}/src"
