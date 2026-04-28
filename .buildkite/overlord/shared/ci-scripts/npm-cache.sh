#!/usr/bin/env bash

if [ $# -eq 0 ]; then
  echo "Usage: $(basename "$0") <path-to-compose-file>"
  exit 1
fi

set -e

COMPOSE_FILE=$1

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: ${COMPOSE_FILE} is not a file"
  exit 1
fi

SYSTEM_DIR=$(git rev-parse --show-toplevel)
SYSTEM_NAME=$(basename "$SYSTEM_DIR")

SCRIPTDIR=$(cd "$(dirname $0)"; pwd)
OVERLORDDIR=$(cd $SCRIPTDIR/../..; pwd)
CONTAINER_OVERLORDDIR=${OVERLORDDIR#$SYSTEM_DIR}

. "${SCRIPTDIR}/../project/modules/workspaces.sh"

MODULE_DIR=$(cd "$(dirname "$COMPOSE_FILE")"; pwd)
MODULE=$(basename "${MODULE_DIR}")
MODULE_TYPE=$(basename "$(dirname "${MODULE_DIR}")")

if [[ "$(uname -m)" == "x86_64" ]] ; then
  CPU_ARCH="amd64"
else
  CPU_ARCH="arm64"
fi

workspaces_cache_required="false"
workspaces_cache_exists="false"

module_cache_required="false"
module_cache_exists="false"

if is_workspace "${SYSTEM_DIR}" "${MODULE_DIR#${SYSTEM_DIR}/}" ; then

  workspaces_cache_required="true"

  # npm workspace cache key uses rootdir package.json & package-lock.json as well as module package.json to ensure cache doesn't hide invalid dependencies
  module_hash=$(echo $(sha256sum "$SYSTEM_DIR/package.json" | cut -d ' ' -f 1)-$(sha256sum "$SYSTEM_DIR/package-lock.json" | cut -d ' ' -f 1)-$(sha256sum "$MODULE_DIR/package.json" | cut -d ' ' -f 1) | sha256sum | cut -d ' ' -f 1)
  workspaces_cache_key="$SYSTEM_NAME-$MODULE-npm-workspaces-root2-$CPU_ARCH-$module_hash"

  if aws s3api head-object --bucket sm.build-artifacts.cache --key "$workspaces_cache_key.tar.gz" >/dev/null 2>&1 ; then
    echo "+++ :aws: :s3: s3://sm.build-artifacts.cache/${workspaces_cache_key}.tar.gz already exists. (workspaces root cache)"
    workspaces_cache_exists="true"
  fi

  if grep -q -F "\"${MODULE_TYPE}/${MODULE}/node_modules/" "$SYSTEM_DIR/package-lock.json"; then

    module_cache_required="true"

    module_cache_key="$SYSTEM_NAME-$MODULE-npm-workspaces-module-$CPU_ARCH-$module_hash"

    if aws s3api head-object --bucket sm.build-artifacts.cache --key "$module_cache_key.tar.gz" >/dev/null 2>&1 ; then
      echo "+++ :aws: :s3: s3://sm.build-artifacts.cache/${module_cache_key}.tar.gz already exists. (workspaces module cache)"
      module_cache_exists="true"
    fi
  fi

elif [[ -f "$MODULE_DIR/package.json" && -f "$MODULE_DIR/package-lock.json" ]] ; then

  module_cache_required="true"

  module_cache_key="$SYSTEM_NAME-$MODULE-npm-$CPU_ARCH-$(sha256sum "$MODULE_DIR/package.json" | cut -d ' ' -f 1)-$(sha256sum "$MODULE_DIR/package-lock.json" | cut -d ' ' -f 1)"

  if aws s3api head-object --bucket sm.build-artifacts.cache --key "$module_cache_key.tar.gz" >/dev/null 2>&1 ; then
    echo "+++ :aws: :s3: s3://sm.build-artifacts.cache/${module_cache_key}.tar.gz already exists. (module cache)"
    module_cache_exists="true"
  fi
fi

if [[ "$workspaces_cache_required" == "false" && "$module_cache_required" == "false" ]] ; then
  echo "Cannot create cache. $SYSTEM_NAME is not a npm workspaces repo or $MODULE is missing $MODULE_DIR/package.json or $MODULE_DIR/package-lock.json"
  exit 2
fi

if [[ "$workspaces_cache_required" == "$workspaces_cache_exists" && "$module_cache_required" == "$module_cache_exists" ]] ; then
  # Covers:
  # Workspaces in play & workspace cache exists.
  # Workspaces in play & module cache exists.
  # Module level package-lock.json exists & module level cache exists.
  exit 0
fi

echo "--- $(date '+%H:%M:%S') :docker: docker compose pull $MODULE"

$(dirname "$0")/../playpen/module-compose.sh "$COMPOSE_FILE" "" pull "$MODULE"

$(dirname "$0")/../playpen/module-compose.sh "$COMPOSE_FILE" "" \
  run --rm \
  -e BUILDKITE \
  -e BUILDKITE_TAG \
  -e BUILDKITE_BRANCH \
  -e BUILDKITE_COMMIT \
  -e BUILDKITE_PIPELINE_SLUG \
  -e BUILDKITE_BUILD_NUMBER \
  "$MODULE" \
  bash -c "set -e; echo \"--- \$(date '+%H:%M:%S') :npm: cache node_modules $CPU_ARCH\" && /app/${CONTAINER_OVERLORDDIR}/shared/project/npm-cache.sh"
