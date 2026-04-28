#!/bin/bash

set -e

if [ $# -eq 0 ]; then
  echo "Usage: $(basename $0) <path-to-dockerfile>"
  exit 1
fi

SYSTEM_DIR=$(git rev-parse --show-toplevel)

SYSTEM_NAME=$(basename $SYSTEM_DIR)

DOCKER_FILE=$1

if [ ! -f "${DOCKER_FILE}" ]; then
  echo "Error: missing ${DOCKER_FILE} ..."
  exit 1
fi

MODULE_DIR=$(dirname $DOCKER_FILE)
pushd "$MODULE_DIR"
MODULE_NAME=$(basename "$PWD")
popd

MIGRATION_IMAGE_NAME="${DOCKER_FILE##*Dockerfile.}"

: ${BUILDKITE_BUILD_NUMBER:=$(date "+%Y%m%d_%H%M%S")}

IMAGE_REPOSITORY="278521702583.dkr.ecr.us-west-2.amazonaws.com/${SYSTEM_NAME}/${MODULE_NAME}"

echo "--- $(date '+%H:%M:%S') Building ${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_BUILD_NUMBER}..."
docker build -t "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_BUILD_NUMBER}" -f $DOCKER_FILE $MODULE_DIR

if [ ! -z ${BUILDKITE} ]; then
  docker push "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_BUILD_NUMBER}"

  BRANCH_TAG="${BUILDKITE_BRANCH//\//_}"

  echo "--- $(date '+%H:%M:%S') Building ${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BRANCH_TAG}..."
  docker tag "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_BUILD_NUMBER}" "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BRANCH_TAG}"
  docker push "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BRANCH_TAG}"

  if [ -n "$BUILDKITE_TAG" ]; then
    echo "--- $(date '+%H:%M:%S') Building ${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_TAG#v}..."
    docker tag "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_BUILD_NUMBER}" "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_TAG#v}"
    docker push "${IMAGE_REPOSITORY}:${MIGRATION_IMAGE_NAME}-${BUILDKITE_TAG#v}"
  fi
fi
