#!/usr/bin/env bash

set -e

if ! command -v git >/dev/null ; then
  echo "Missing git which is needed for cache. Exiting."
  exit 2
fi

if ! command -v aws >/dev/null ; then
  echo "Missing aws which is needed for cache. Exiting."
  exit 2
fi

if ! command -v sha256sum >/dev/null ; then
  echo "Missing sha256sum which is needed for cache. Exiting."
  exit 2
fi

MODULE_DIR=$(pwd)
MODULE="$(basename "${MODULE_DIR}")"
MODULE_TYPE=$(basename "$(dirname "${MODULE_DIR}")")

echo "$(date '+%H:%M:%S') Running $(basename "$0") in $MODULE..."
echo

SYSTEM_DIR=$(git rev-parse --show-toplevel)
SYSTEM_NAME=$(basename "$(git config --get remote.origin.url)" .git)

SCRIPTDIR=$(dirname "$0")

. "${SCRIPTDIR}/modules/cache.sh"
. "${SCRIPTDIR}/modules/workspaces.sh"

if [[ -z "$BUILDKITE" ]] ; then
  exit 0
fi

if [[ "$(uname -m)" == "x86_64" ]] ; then
  CPU_ARCH="amd64"
else
  CPU_ARCH="arm64"
fi

if is_workspace "${SYSTEM_DIR}" "${MODULE_DIR#${SYSTEM_DIR}/}" ; then
  # npm workspace cache key uses rootdir package.json & package-lock.json as well as module package.json to ensure cache doesn't hide invalid dependencies
  module_hash=$(echo $(sha256sum "$SYSTEM_DIR/package.json" | cut -d ' ' -f 1)-$(sha256sum "$SYSTEM_DIR/package-lock.json" | cut -d ' ' -f 1)-$(sha256sum package.json | cut -d ' ' -f 1) | sha256sum | cut -d ' ' -f 1)
  workspaces_cache_key="$SYSTEM_NAME-$MODULE-npm-workspaces-root2-$CPU_ARCH-$module_hash"

  if grep -q -F "\"${MODULE_TYPE}/${MODULE}/node_modules/" "$SYSTEM_DIR/package-lock.json"; then
    module_cache_key="$SYSTEM_NAME-$MODULE-npm-workspaces-module-$CPU_ARCH-$module_hash"
  fi
else
  module_cache_key="$SYSTEM_NAME-$MODULE-npm-$CPU_ARCH-$(sha256sum package.json | cut -d ' ' -f 1)-$(sha256sum package-lock.json | cut -d ' ' -f 1)"
fi

# No need to re-generate if cache exists, duplicated here again to cater for race conditions with parallel build.
if [[ -n "$workspaces_cache_key" ]] ; then
  if cache_exists "$workspaces_cache_key" ; then
    echo "Workspace: $workspaces_cache_key already exists."
  else
    workspaces_cache_save_required="true"
  fi
fi

if [[ -n "$module_cache_key" ]] ; then
  if cache_exists "$module_cache_key" ; then
    echo "Module: $module_cache_key already exists."
  else
    module_cache_save_required="true"
  fi
fi

if [[ "$workspaces_cache_save_required" == "true" || "$module_cache_save_required" == "true" ]] ; then
  echo "$(date '+%H:%M:%S') Executing npm ci..."
  npm ci --no-audit --include-workspace-root
fi

if [[ "$workspaces_cache_save_required" == "true" ]] ; then
  pushd "$SYSTEM_DIR" >/dev/null
  save_cache "$workspaces_cache_key" node_modules
  popd >/dev/null
fi

if [[ "$module_cache_save_required" == "true" ]] ; then
  save_cache "$module_cache_key" node_modules
fi
