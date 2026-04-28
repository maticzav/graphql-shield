#!/bin/bash

set -eo pipefail

# tags will perform a full build
if [ -n "$BUILDKITE_TAG" ]; then

  if [[ "$BUILDKITE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] ; then
    echo "Tag: $BUILDKITE_TAG. Full build"
    rm -f git-diff.txt
    exit 0
  else
    MODULE=$(echo "$BUILDKITE_TAG" | cut -d . -f1)

    # tag for specific module
    if [[ -d "packages/$MODULE" ]] ; then
      echo "Tag: $BUILDKITE_TAG. Package build"
      echo "packages/$MODULE/" > git-diff.txt
      buildkite-agent artifact upload git-diff.txt
      exit 0
    elif [[ -d "libs/$MODULE" ]] ; then
      echo "Tag: $BUILDKITE_TAG. Package build"
      echo "libs/$MODULE/" > git-diff.txt
      buildkite-agent artifact upload git-diff.txt
      exit 0
    elif [[ -d "components/$MODULE" ]] ; then
      echo "Tag: $BUILDKITE_TAG. Component build"
      echo "components/$MODULE/" > git-diff.txt
      buildkite-agent artifact upload git-diff.txt
      exit 0
    elif [[ -d "frontends/$MODULE" ]] ; then
      echo "Tag: $BUILDKITE_TAG. Frontend build"
      echo "frontends/$MODULE/" > git-diff.txt
      buildkite-agent artifact upload git-diff.txt
      exit 0
    fi

    echo -e "\033[1;31mERROR:\033[0m Tag '$BUILDKITE_TAG' does not match any module, i.e. nothing found under packages/*, libs/*, components/*, frontends/*"
    exit 1

  fi

fi

# master branch is a special branch so do a full build
if [ "$BUILDKITE_BRANCH" == "master" ]; then
  rm -f git-diff.txt
  exit 0
fi

# manual rebuild is a full build
if [ -n "$BUILDKITE_REBUILT_FROM_BUILD_ID" ]; then
  rm -f git-diff.txt
  exit 0
fi

# scheduled build are there to do a period audit so it has to be a full build
if [ "$BUILDKITE_SOURCE" == "schedule" ]; then
  rm -f git-diff.txt
  exit 0
fi

# atm, trigger builds are primarily to run cypress steps so for now hardcode the git diff to incl frontends & beefs
if [ "$BUILDKITE_SOURCE" == "trigger_job" ]; then
  ls -d frontends/* components/*-beef > git-diff.txt
  exit 0
fi

set -e

SCRIPTDIR=$(dirname "$0")

. "${SCRIPTDIR}/modules/git-sha.sh"

_create_git_diff
