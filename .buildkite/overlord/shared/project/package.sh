#!/usr/bin/env bash

echo "$(date '+%H:%M:%S') Running $(basename $0) in $(basename $(pwd))..."
echo

set -e

rm -rf build

STAGE=./build/stage

echo "Running npm ci in ${STAGE} directory..."

mkdir -p $STAGE
cp package.json package-lock.json $STAGE
npm ci --no-audit --include-workspace-root --omit=dev --prefix $STAGE

component_name=$(node -e "console.log(require('./package.json').name)")

artifact_name="${component_name}-$(date "+%Y%m%d_%H%M%S")"

if [ ! -z $BUILDKITE ] ; then

  if [ -z $BUILDKITE_TAG ] ; then
    artifact_name="${component_name}-build-${BUILDKITE_BUILD_NUMBER}"
  else
    artifact_name="${component_name}-${BUILDKITE_TAG#v}"
  fi
fi

if [ ! -d ./dist ] ; then
  echo "Error: missing dist dir"
  exit 1
fi

echo
echo "Creating ${artifact_name}.zip..."

cp -r ./dist/* ./build/stage/

cd ./build/stage

zip ${artifact_name}.zip -r . >/dev/null

if [ ! -f ../../Dockerfile -a ! -z "$BUILDKITE_BRANCH" -a -z "$BUILDKITE_TAG" ] ; then

  BRANCH_TAG="${BUILDKITE_BRANCH//\//_}"

  echo
  echo "Creating ${component_name}-${BRANCH_TAG}.zip..."

  cp ${artifact_name}.zip ../${component_name}-${BRANCH_TAG}.zip
fi

mv ${artifact_name}.zip ../

echo "$(date '+%H:%M:%S') package.sh complete"
