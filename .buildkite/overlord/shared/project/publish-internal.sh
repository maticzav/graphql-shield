#!/usr/bin/env bash

echo "$(date '+%H:%M:%S') Running $(basename $0) in $(basename $(pwd))..."
echo

set -e

pkg=$(jq --raw-output .name ./package.json)
version=$(jq --raw-output .version ./package.json)

count=$(npm show --silent "${pkg}@${version}" version | wc -l)

if [ $count -eq 1 ]; then
  echo "Nothing to publish. Exiting..."
  exit 0
fi

tag=""

if [[ "$version" =~ -beta\. ]]; then
  tag="--tag beta"
fi

compile=$(jq '.scripts.compile' ./package.json)

if [ "$compile" != "null" ]; then
  echo "Executing npm compile..."
  npm run compile
fi

if [ -z "$PUBLISH_FROM_MODULE" ]; then
  cp package.json dist/

  if [ -f "README.md" ]; then
    cp README.md dist/
  fi
fi

if [ -n "$BUILDKITE" ]; then
  [ -z "$PUBLISH_FROM_MODULE" ] && pushd dist > /dev/null
  npm publish $tag --access restricted
  [ -z "$PUBLISH_FROM_MODULE" ] && popd > /dev/null
fi

echo "$(date '+%H:%M:%S') publish.sh complete"
