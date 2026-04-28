#!/usr/bin/env bash

echo "$(date '+%H:%M:%S') Running $(basename $0) in $(basename $(pwd))..."
echo

set -e

component_name=$(node -e "console.log(require('./package.json').name)")

artifact_name="${component_name}-$(date "+%Y%m%d_%H%M%S")"

if [ ! -z $BUILDKITE ] ; then

  if [ -z $BUILDKITE_TAG ] ; then
    artifact_name="${component_name}-build-${BUILDKITE_BUILD_NUMBER}"
  else
    artifact_name="${component_name}-${BUILDKITE_TAG#v}"
  fi
fi

if [ ! -d ./build ] ; then
  echo "Error: missing build dir"
  exit 1
fi

echo "Creating ${artifact_name}.zip..."

cd ./build

zip ${artifact_name}.zip -r . >/dev/null

if [ ! -z "$BUILDKITE_BRANCH" -a -z "$BUILDKITE_TAG" ] ; then

  BRANCH_TAG="${BUILDKITE_BRANCH//\//_}"

  echo "Creating ${component_name}-${BRANCH_TAG}.zip..."

  cp ${artifact_name}.zip ${component_name}-${BRANCH_TAG}.zip
fi

echo "$(date '+%H:%M:%S') package-frontend.sh complete"
