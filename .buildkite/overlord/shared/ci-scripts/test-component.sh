#!/bin/bash

if [ $# -lt 2 ]; then
  echo "Usage: $(basename $0) <path-to-compose-file> <image-tag> [test-service]"
  exit 1
fi

set -ex

COMPOSE_FILE=$1
IMAGE_TAG=$2
TEST_SERVICE=$3

if [ ! -f $COMPOSE_FILE ]; then
  echo "Error: ${COMPOSE_FILE} is not a file"
  exit 1
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel)
PROJECT_NAME=$(basename $PROJECT_ROOT)-playpen
COMPONENT_DIR=$(dirname $COMPOSE_FILE)
pushd "$COMPONENT_DIR"
SERVICE_NAME=$(basename "$PWD")
popd

SCRIPTDIR=$(cd $(dirname $0); pwd)
OVERLORDDIR=$(cd $SCRIPTDIR/../..; pwd)
CONTAINER_OVERLORDDIR=${OVERLORDDIR#$PROJECT_ROOT}

if [ -z "$TEST_SERVICE" ]; then
  TEST_SERVICE=${SERVICE_NAME}-test-runner
fi

SYSTEM_NAME=$(basename $PROJECT_ROOT)

playpenStart=$(jq -r '.scripts."playpen:start"' ${PROJECT_ROOT}/package.json)

if [ "$playpenStart" != "null" ]; then
  ${PROJECT_ROOT}/${playpenStart}
else
  $(dirname $0)/../playpen/start.sh -p ${SERVICE_NAME}
fi

docker ps

$(dirname $0)/../playpen/infras-compose.sh -p ${SERVICE_NAME} ps

# This is a workaround to the fact that docker-compose ps does not show enough
# status details compared to docker ps. So an assumption is made about the host
# system docker containers when this check is done.

set +ex

unhealthy=1
while [ $unhealthy -eq 1 ] ; do
  echo "waiting for all containers to be healthy..."
  docker ps | grep -q -e "(health: starting)\|(unhealthy)"
  if [ $? -eq 0 ]; then
    unhealthy=1
  else
    unhealthy=0
    break
  fi
  sleep 2
done

set -ex

COMPONENT_IMAGE="278521702583.dkr.ecr.us-west-2.amazonaws.com/${SYSTEM_NAME}/${SERVICE_NAME}:${IMAGE_TAG}" \
  $(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "test-component" pull

COMPONENT_IMAGE="278521702583.dkr.ecr.us-west-2.amazonaws.com/${SYSTEM_NAME}/${SERVICE_NAME}:${IMAGE_TAG}" \
  $(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "test-component" up -d $SERVICE_NAME

# Do the health check again here after the module service is "up'ed"
# Cannot bring infras up & module service up and then do a single wait because
# the module can depend on infras.

set +ex

unhealthy=1
while [ $unhealthy -eq 1 ] ; do
  echo "waiting for all containers to be healthy..."
  docker ps | grep -q -e "(health: starting)\|(unhealthy)"
  if [ $? -eq 0 ]; then
    unhealthy=1
  else
    unhealthy=0
    break
  fi
  sleep 2
done

set -x

$(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "test-component" run --rm -e BUILDKITE $TEST_SERVICE \
  bash -c "set -ex; (/app/${CONTAINER_OVERLORDDIR}/shared/project/bootstrap.sh && npm run clean && npm run test-component) || /app/${CONTAINER_OVERLORDDIR}/shared/ci-scripts/cat-npm-logs.sh \$?"

rc=$?

set +x

docker ps -a
docker stats --all --no-stream

if [ $rc -ne 0 ]; then
  mkdir -p ${COMPONENT_DIR}/test/end-to-end/logs

  docker ps -a --format '{{ .Names }}' | while read svc
  do
    docker logs $svc > ${COMPONENT_DIR}/test/end-to-end/logs/${svc}.log 2>&1
  done

fi

exit $rc
