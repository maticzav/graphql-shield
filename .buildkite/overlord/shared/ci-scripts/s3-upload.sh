#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Usage: $(basename $0) <path-to-compose-file>"
  exit 1
fi

set -e

PROJECT_ROOT=$(git rev-parse --show-toplevel)

PROJECT_NAME=$(basename $PROJECT_ROOT)
COMPOSE_FILE=$1
MODULE_DIR=$(dirname $COMPOSE_FILE)
pushd "$MODULE_DIR"
MODULE=$(basename "$PWD")
popd

mkdir -p ${MODULE_DIR}/build
rm -rf ${MODULE_DIR}/build/*

echo "--- $(date '+%H:%M:%S') Downloading artifacts..."
buildkite-agent artifact download "${MODULE_DIR}/build/*.zip" . || echo
buildkite-agent artifact download "${MODULE_DIR}/build/*.jar" . || echo

ls ${MODULE_DIR}/build/*.zip | while read f
do
  echo "--- $(date '+%H:%M:%S') Uploading $f..."
  aws s3 cp --acl bucket-owner-full-control $f s3://sm.build-artifacts.build/${PROJECT_NAME}-${MODULE}/
done

ls ${MODULE_DIR}/build/*.jar | while read f
do
  echo "--- $(date '+%H:%M:%S') Uploading $f..."
  aws s3 cp --acl bucket-owner-full-control $f s3://sm.build-artifacts.build/${PROJECT_NAME}-${MODULE}/
done
