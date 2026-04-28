#!/bin/bash

if [ $# -ne 2 ]; then
  echo "Usage: $(basename $0) <path-to-dockerfile> <image-tag>"
  exit 1
fi

set -e

SYSTEM_DIR=$(git rev-parse --show-toplevel)

SYSTEM_NAME=$(basename $SYSTEM_DIR)

DOCKER_FILE=$1
IMAGE_TAG=$2

if [ ! -f "$DOCKER_FILE" ]; then
  echo "Error: missing ${DOCKER_FILE} ..."
  exit 1
fi

COMPONENT_DIR=$(dirname $DOCKER_FILE)
pushd "$COMPONENT_DIR"
COMPONENT=$(basename "$PWD")
popd

if [ -n "$BUILDKITE" ]; then
  echo "--- $(date '+%H:%M:%S') Downloading artifacts..."
  bk_artifact_prefix="${COMPONENT_DIR}/build"
  bk_artifact_prefix=${bk_artifact_prefix#./}

  mkdir -p $bk_artifact_prefix
  rm -rf $bk_artifact_prefix/*

  buildkite-agent artifact download "${bk_artifact_prefix}/*.jar" . || echo
  buildkite-agent artifact download "${bk_artifact_prefix}/*.zip" . || echo
fi

IMAGE_REPOSITORY="278521702583.dkr.ecr.us-west-2.amazonaws.com/${SYSTEM_NAME}/${COMPONENT}"

echo "--- $(date '+%H:%M:%S') Building ${IMAGE_REPOSITORY}:${IMAGE_TAG}..."
docker build -f ${DOCKER_FILE} -t ${IMAGE_REPOSITORY}:${IMAGE_TAG} ${COMPONENT_DIR} --build-arg COMPONENT=$COMPONENT

if [ -n "$BUILDKITE" ]; then
  docker push "${IMAGE_REPOSITORY}:${IMAGE_TAG}"

  BRANCH_TAG="${BUILDKITE_BRANCH//\//_}"

  echo "--- $(date '+%H:%M:%S') Building ${IMAGE_REPOSITORY}:${BRANCH_TAG}..."
  docker tag "${IMAGE_REPOSITORY}:${IMAGE_TAG}" "${IMAGE_REPOSITORY}:${BRANCH_TAG}"
  docker push "${IMAGE_REPOSITORY}:${BRANCH_TAG}"

  if [ -n "$BUILDKITE_TAG" ]; then
    echo "--- $(date '+%H:%M:%S') Building ${IMAGE_REPOSITORY}:${BUILDKITE_TAG}..."
    docker tag "${IMAGE_REPOSITORY}:${IMAGE_TAG}" "${IMAGE_REPOSITORY}:${BUILDKITE_TAG}"
    docker push "${IMAGE_REPOSITORY}:${BUILDKITE_TAG}"
  fi
fi
