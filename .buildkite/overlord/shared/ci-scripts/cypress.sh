#!/bin/bash

if [ $# -ne 3 ]; then
  echo "Usage: $(basename $0) <path-to-compose-file> <path-to-frontend-cypress-suite> <path-to-beef-harness>"
  exit 1
fi

set -e

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

CYPRESS_SUITE_FILE=$2

if [ ! -f ${MODULE_DIR}/${CYPRESS_SUITE_FILE} ]; then
  echo "Error: ${MODULE_DIR}/${CYPRESS_SUITE_FILE} is not a file"
  exit 1
fi

BEEF_HARNESS_FILE=$3
CYPRESS_SUITE_NAME=$(basename $BEEF_HARNESS_FILE .ts)
CYPRESS_PROFILE="${SERVICE_NAME}-cypress"

if [ ! -f ${MODULE_DIR}/../../components/${SERVICE_NAME}-beef/${BEEF_HARNESS_FILE} ]; then
  echo "Error: ${MODULE_DIR}/../../components/${SERVICE_NAME}-beef/${BEEF_HARNESS_FILE} is not a file"
  exit 1
fi

echo "--- $(date '+%H:%M:%S') :docker: playpen start..."

playpenStart=$(jq -r '.scripts."playpen:start"' ${PROJECT_ROOT}/package.json)

if [ "$playpenStart" != "null" ]; then
  ${PROJECT_ROOT}/${playpenStart}
else
  $(dirname $0)/../playpen/start.sh -p ${CYPRESS_PROFILE}
fi

echo
echo "All containers"
docker ps -a

echo
echo "Running playpen containers"
$(dirname $0)/../playpen/infras-compose.sh -p ${CYPRESS_PROFILE} ps

# This is a workaround to the fact that docker-compose ps does not show enough
# status details compared to docker ps. So an assumption is made about the host
# system docker containers when this check is done.
# TODO: Use docker compose ps --format json | jq '. | map(select(.Health == "healthy") | .Service)'

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

  mkdir -p ${MODULE_DIR}/test/end-to-end/logs

  docker ps -a --format '{{ .Names }}' | while read svc
  do
    echo "--- $(date '+%H:%M:%S') :docker: Creating ${svc}.log..."
    docker logs $svc > ${MODULE_DIR}/test/end-to-end/logs/${svc}.log 2>&1
  done

  exit $playpen_rc
fi

set -e

COMPONENT_COMPOSE_FILE=${MODULE_DIR}/../../components/${SERVICE_NAME}-beef/docker-compose.yaml

echo "--- $(date '+%H:%M:%S') :docker: docker compose pull (cypress)"

CYPRESS_SUITE_NAME=${CYPRESS_SUITE_NAME} HARNESS_FILE=${BEEF_HARNESS_FILE} \
  $(dirname $0)/../playpen/module-compose.sh ${COMPONENT_COMPOSE_FILE} "cypress" pull

echo "--- $(date '+%H:%M:%S') :docker: docker compose up (cypress)"

CYPRESS_SUITE_NAME=${CYPRESS_SUITE_NAME} HARNESS_FILE=${BEEF_HARNESS_FILE} \
  $(dirname $0)/../playpen/module-compose.sh ${COMPONENT_COMPOSE_FILE} "cypress" up -d ${SERVICE_NAME}-beef

docker ps -a
docker stats --all --no-stream

set +e

max_count=60
count=1

beef_port=$(docker ps --filter "name=playpen-${SERVICE_NAME}-beef" --format "{{.Ports}}" | cut -d: -f2 | cut -d- -f1)

while [[ $count -le $max_count ]] && ! $(curl --output /dev/null --fail --silent http://localhost:${beef_port}/healthcheck)
do
  echo "attempt #${count} of ${max_count} waiting for (${SERVICE_NAME}-beef) http://localhost:${beef_port}/healthcheck to be up..."
  ((count+=1))
  sleep 6
done

if ! $(curl --output /dev/null --fail --silent http://localhost:${beef_port}/healthcheck) ; then
  $(dirname $0)/../playpen/module-compose.sh ${MODULE_DIR}/../../components/${SERVICE_NAME}-beef/docker-compose.yaml cypress logs ${SERVICE_NAME}-beef

  echo "^^^ +++"
  echo "${SERVICE_NAME}-beef failed to start..."
  exit 1
fi

set +e

max_count=60
count=1
harness_rc=2

while [[ $count -le $max_count && $harness_rc -ne 0 ]]
do
  echo "attempt #${count} of ${max_count} waiting for all containers to be healthy..."

  docker ps | grep -q -e "(health: starting)\|(unhealthy)"
  if [ $? -eq 0 ]; then
    harness_rc=2 # Exit code 2 means no automatic recovery
  else
    harness_rc=0
    break
  fi

  ((count+=1))
  sleep 6
done

rc=$harness_rc

set +e

if [[ $harness_rc -eq 0 ]]; then

  docker stats --all --no-stream

  echo "--- $(date '+%H:%M:%S') :docker: docker compose pull $SERVICE_NAME"

  $(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "" pull $SERVICE_NAME

  $(dirname $0)/../playpen/module-compose.sh $COMPOSE_FILE "" \
    run --rm \
    -e BUILDKITE \
    $SERVICE_NAME \
    bash -c "/app/${CONTAINER_OVERLORDDIR}/shared/ci-scripts/cypress-exec.sh ${CYPRESS_SUITE_FILE}"

  rc=$?
else
  echo "+++ $(date '+%H:%M:%S') Some containers are either unhealthy or took too long starting up..."
  docker ps -a
  docker stats --all --no-stream
fi

# Always generate logs
mkdir -p ${MODULE_DIR}/test/end-to-end/logs

docker ps -a --format '{{ .Names }}' | while read svc
do
  echo "--- $(date '+%H:%M:%S') :docker: Creating ${svc}.log..."
  docker logs $svc > ${MODULE_DIR}/test/end-to-end/logs/${svc}.log 2>&1
done

echo "--- $(date '+%H:%M:%S') :docker: Creating docker-stats.log..."
docker stats --all --no-stream > ${MODULE_DIR}/test/end-to-end/logs/docker-stats.log

echo "--- $(date '+%H:%M:%S') :docker: playpen stop..."
$(dirname $0)/../playpen/stop.sh

exit $rc
