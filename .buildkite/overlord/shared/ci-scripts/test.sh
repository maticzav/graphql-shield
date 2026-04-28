#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Usage: $(basename $0) <path-to-compose-file>"
  exit 1
fi

set -e

if [[ -n "${BUILDKITE_PARALLEL_JOB}" && -n "${BUILDKITE_PARALLEL_JOB_COUNT}" ]]; then
  JEST_PARALLELISM_SHARD=$(($BUILDKITE_PARALLEL_JOB + 1))/$BUILDKITE_PARALLEL_JOB_COUNT
  echo "Jest parallelism build detected, running tests in parallel - shard $JEST_PARALLELISM_SHARD"
fi

if [[ -z "$TEST_COMMAND" ]]; then
  TEST_COMMAND="npm run test"
fi

COMPOSE_FILE=$1

if [ ! -f $COMPOSE_FILE ]; then
  echo "Error: ${COMPOSE_FILE} is not a file"
  exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel)

MODULE_DIR=$(dirname $COMPOSE_FILE)
pushd "$MODULE_DIR"
SERVICE_NAME=$(basename "$PWD")
popd

SCRIPTDIR=$(cd $(dirname $0); pwd)
OVERLORDDIR=$(cd $SCRIPTDIR/../..; pwd)
CONTAINER_OVERLORDDIR=${OVERLORDDIR#$PROJECT_ROOT}

echo "--- $(date '+%H:%M:%S') :docker: playpen start..."

playpenStart=$(jq -r '.scripts."playpen:start"' ${PROJECT_ROOT}/package.json)

if [ "$playpenStart" != "null" ]; then
  ${PROJECT_ROOT}/${playpenStart}
else
  $(dirname $0)/../playpen/start.sh -p ${SERVICE_NAME}
fi

echo
echo "All containers"
docker ps -a

echo
echo "Running  playpen containers"
$(dirname $0)/../playpen/infras-compose.sh -p ${SERVICE_NAME} ps

# This is a workaround to the fact that docker-compose ps does not show enough
# status details compared to docker ps. So an assumption is made about the host
# system docker containers when this check is done.

set +e

max_count=60
count=1
playpen_rc=2

while [[ $count -le $max_count && $playpen_rc -ne 0 ]] ; do
  echo "waiting for all containers to be healthy..."
  docker ps | grep -q -e "(health: starting)\|(unhealthy)"
  if [ $? -eq 0 ]; then
    playpen_rc=2 # Exit code 2 means no automatic recovery
  else
    playpen_rc=0
    break
  fi

  ((count+=1))
  sleep 2
done

if [[ $playpen_rc -ne 0 ]]; then

  echo "+++ $(date '+%H:%M:%S') Some containers are either unhealthy or took too long starting up..."
  docker ps -a
  docker stats --all --no-stream

  mkdir -p ${MODULE_DIR}/test/logs

  docker ps -a --format '{{ .Names }}' | while read svc
  do
    echo "--- $(date '+%H:%M:%S') :docker: Creating ${svc}.log..."
    docker logs $svc > ${MODULE_DIR}/test/logs/${svc}.log 2>&1
  done

  echo "--- $(date '+%H:%M:%S') :docker: Creating docker-stats.log..."
  docker stats --all --no-stream > ${MODULE_DIR}/test/logs/docker-stats.log

  exit $playpen_rc
fi

# Playpen has started, now run tests

set -e

echo "--- $(date '+%H:%M:%S') :docker: docker compose pull $SERVICE_NAME"

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "runtime" pull $SERVICE_NAME

set +e

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "runtime" \
  run --rm \
  -e BUILDKITE \
  -e BUILDKITE_TAG \
  -e BUILDKITE_BRANCH \
  -e BUILDKITE_COMMIT \
  -e BUILDKITE_PIPELINE_SLUG \
  -e BUILDKITE_BUILD_NUMBER \
  -e BUILDKITE_BUILD_ID \
  -e BUILDKITE_PULL_REQUEST \
  -e BUILDKITE_MESSAGE \
  -e BUILDKITE_ANALYTICS_TOKEN \
  -e JEST_PARALLELISM_SHARD="${JEST_PARALLELISM_SHARD}" \
  $SERVICE_NAME \
  bash -c "set -e; (echo \"--- \$(date '+%H:%M:%S') :npm: ci\" && /app/${CONTAINER_OVERLORDDIR}/shared/project/bootstrap.sh && echo \"--- \$(date '+%H:%M:%S') :npm: clean\" && npm run clean && echo \"+++ \$(date '+%H:%M:%S') :npm: test\" && ${TEST_COMMAND}) || /app/${CONTAINER_OVERLORDDIR}/shared/ci-scripts/cat-npm-logs.sh \$?"

rc=$?

if [[ $rc -ne 0 ]]; then

  mkdir -p ${MODULE_DIR}/test/logs

  docker ps -a --format '{{ .Names }}' | while read svc
  do
    echo "--- $(date '+%H:%M:%S') :docker: Creating ${svc}.log..."
    docker logs $svc > ${MODULE_DIR}/test/logs/${svc}.log 2>&1
  done

  echo "--- $(date '+%H:%M:%S') :docker: Creating docker-stats.log..."
  docker stats --all --no-stream > ${MODULE_DIR}/test/logs/docker-stats.log

fi

echo "--- $(date '+%H:%M:%S') :docker: playpen stop..."
$(dirname $0)/../playpen/stop.sh

exit $rc
