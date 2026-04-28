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

MODULE_DIR=$(dirname "$COMPOSE_FILE")
pushd "$MODULE_DIR"
MODULE=$(basename "$PWD")
popd

echo "--- $(date '+%H:%M:%S') :docker: docker compose pull $MODULE"

PROJECT_ROOT=$(git rev-parse --show-toplevel)
SCRIPTDIR=$(cd $(dirname $0); pwd)
OVERLORDDIR=$(cd $SCRIPTDIR/../..; pwd)
CONTAINER_OVERLORDDIR=${OVERLORDDIR#$PROJECT_ROOT}

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "runtime" pull $MODULE

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "runtime" \
  run --rm \
  -e BUILDKITE \
  -e BUILDKITE_TAG \
  -e BUILDKITE_BRANCH \
  -e BUILDKITE_COMMIT \
  -e BUILDKITE_PIPELINE_SLUG \
  -e BUILDKITE_BUILD_NUMBER \
  $MODULE \
  bash -c "set -e; (echo \"--- \$(date '+%H:%M:%S') :npm: ci\" && /app/${CONTAINER_OVERLORDDIR}/shared/project/bootstrap.sh && echo \"--- \$(date '+%H:%M:%S') :npm: clean\" && npm run clean && echo \"+++ \$(date '+%H:%M:%S') :npm: package\" && npm run package) || /app/${CONTAINER_OVERLORDDIR}/shared/ci-scripts/cat-npm-logs.sh \$?"
