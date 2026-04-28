#!/usr/bin/env bash

set -e

echo "$(date '+%H:%M:%S') Running $(basename "$0") in $(basename "$(pwd)")..."
echo

SCRIPTDIR=$(dirname "$0")

. "${SCRIPTDIR}/modules/cache.sh"
. "${SCRIPTDIR}/modules/workspaces.sh"

# When running on CI, deal with cache.
if [ -n "$BUILDKITE" ]; then

  if ! command -v git >/dev/null ; then
    echo "Missing git which is needed for cache, cannot restore."
  else
    git_exists="true"
  fi

  if ! command -v aws >/dev/null ; then
    echo "Missing aws which is needed for cache, cannot restore."
  else
    aws_exists="true"
  fi

  if ! command -v sha256sum >/dev/null ; then
    echo "Missing sha256sum which is needed for cache, cannot restore."
  else
    sha256sum_exists="true"
  fi

  if [[ "$git_exists" == "true" && "$aws_exists" == "true" && "$sha256sum_exists" == "true" ]] ; then

    SYSTEM_DIR=$(git rev-parse --show-toplevel)
    SYSTEM_NAME=$(basename "$(git config --get remote.origin.url)" .git)

    MODULE_DIR=$(pwd)
    MODULE=$(basename "${MODULE_DIR}")
    MODULE_TYPE=$(basename "$(dirname "${MODULE_DIR}")")

    if [[ "$(uname -m)" == "x86_64" ]] ; then
      CPU_ARCH="amd64"
    else
      CPU_ARCH="arm64"
    fi

    if is_workspace "${SYSTEM_DIR}" "${MODULE_DIR#${SYSTEM_DIR}/}" ; then
      # npm workspace cache key uses rootdir package.json & package-lock.json as well as module package.json to ensure cache doesn't hide invalid dependencies
      module_hash=$(echo $(sha256sum "$SYSTEM_DIR/package.json" | cut -d ' ' -f 1)-$(sha256sum "$SYSTEM_DIR/package-lock.json" | cut -d ' ' -f 1)-$(sha256sum package.json | cut -d ' ' -f 1) | sha256sum | cut -d ' ' -f 1)
      workspaces_cache_key="$SYSTEM_NAME-$MODULE-npm-workspaces-root2-$CPU_ARCH-$module_hash"
      pushd "$SYSTEM_DIR" >/dev/null
      restore_cache "$workspaces_cache_key" node_modules # safe as tar -x will merge into the directory
      popd >/dev/null

      if grep -q -F "\"${MODULE_TYPE}/${MODULE}/node_modules/" "$SYSTEM_DIR/package-lock.json"; then
        module_cache_key="$SYSTEM_NAME-$MODULE-npm-workspaces-module-$CPU_ARCH-$module_hash"
        restore_cache "$module_cache_key" node_modules "${MODULE_TYPE}/${MODULE}"
      fi

    else
      cache_key="$SYSTEM_NAME-$MODULE-npm-$CPU_ARCH-$(sha256sum package.json | cut -d ' ' -f 1)-$(sha256sum package-lock.json | cut -d ' ' -f 1)"
      restore_cache "$cache_key" node_modules
    fi

  fi

  if is_workspace "${SYSTEM_DIR}" "${MODULE_DIR#${SYSTEM_DIR}/}" ; then

    set +e
    deps=$(npm ls --include=dev --include=prod --depth=0 2>&1)
    set -e

    if (echo "$deps" | grep -q '(empty)') || (echo "$deps" | grep -q 'invalid:') || (echo "$deps" | grep -q "UNMET DEPENDENCY"); then

      # Missing dependencies. Potentially due to missed deps in libs or packages local node_modules folders. Try to restore caches.

      set +e
      missing_libs=( $(grep -E "\"libs/(.*)/node_modules/" "$SYSTEM_DIR/package-lock.json" | cut -d '/' -f 2 | sort | uniq) )
      set -e

      for lib in "${missing_libs[@]}" ; do
        if [[ "$lib" != "$MODULE" && -d "$SYSTEM_DIR/libs/$lib" && -f "$SYSTEM_DIR/libs/$lib/package.json" ]]; then
          pushd "$SYSTEM_DIR/libs/$lib" >/dev/null
          lib_hash=$(echo $(sha256sum "$SYSTEM_DIR/package.json" | cut -d ' ' -f 1)-$(sha256sum "$SYSTEM_DIR/package-lock.json" | cut -d ' ' -f 1)-$(sha256sum package.json | cut -d ' ' -f 1) | sha256sum | cut -d ' ' -f 1)
          lib_cache_key="$SYSTEM_NAME-$lib-npm-workspaces-module-$CPU_ARCH-$lib_hash"
          restore_cache "$lib_cache_key" node_modules "libs/$lib"
          popd >/dev/null
        fi
      done

      set +e
      missing_packages=( $(grep -E "\"packages/(.*)/node_modules/" "$SYSTEM_DIR/package-lock.json" | cut -d '/' -f 2 | sort | uniq) )
      set -e

      for package in "${missing_packages[@]}" ; do
        if [[ "$package" != "$MODULE" && -d "$SYSTEM_DIR/packages/$package" && -f "$SYSTEM_DIR/packages/$package/package.json" ]]; then
          pushd "$SYSTEM_DIR/packages/$package" >/dev/null
          package_hash=$(echo $(sha256sum "$SYSTEM_DIR/package.json" | cut -d ' ' -f 1)-$(sha256sum "$SYSTEM_DIR/package-lock.json" | cut -d ' ' -f 1)-$(sha256sum package.json | cut -d ' ' -f 1) | sha256sum | cut -d ' ' -f 1)
          package_cache_key="$SYSTEM_NAME-$package-npm-workspaces-module-$CPU_ARCH-$package_hash"
          restore_cache "$package_cache_key" node_modules "packages/$package"
          popd >/dev/null
        fi
      done
    fi

    # Check once more, in case the above failed.
    set +e
    deps=$(npm ls --include=dev --include=prod --depth=0 2>&1)
    set -e

    if (echo "$deps" | grep -q '(empty)') || (echo "$deps" | grep -q 'invalid:') || (echo "$deps" | grep -q "UNMET DEPENDENCY"); then
      echo "$(date '+%H:%M:%S') Executing npm ci, as either missing all dependencies or some unmet dependencies..."
      echo "$deps"
      if ! npm ci --no-audit --include-workspace-root ; then
        exit 2 # Exit code 2 means no automatic recovery
      fi
    fi

  elif [[ ! -d node_modules ]]; then

    dependencies=$(jq '.dependencies' 'package.json')
    peer_dependencies=$(jq '.peerDependencies' 'package.json')
    dev_dependencies=$(jq '.devDependencies' 'package.json')

    if [[ "$dependencies" == "null" && "$peer_dependencies" == "null" && "$dev_dependencies" == "null" ]]; then

      echo "$(date '+%H:%M:%S') No 'dependencies', 'peerDependencies' or 'devDependencies'. Not executing npm ci"

    else

      echo "$(date '+%H:%M:%S') Executing npm ci, as node_modules cache not found..."
      if ! npm ci --no-audit ; then
        exit 2 # Exit code 2 means no automatic recovery
      fi
    fi

  fi

else

  set +e # grep exits with 1 if nothing found, so turn off error check for this line.
  missing=$(npm ls --include=dev --include=prod --depth=0 2>/dev/null | grep -c "UNMET DEPENDENCY")
  set -e

  if (npm ls --include=dev --include=prod --depth=0 2>&1 | grep -q '(empty)') || (npm ls --include=dev --include=prod --depth=0 2>&1 | grep -q 'invalid:') || [ "$missing" -gt 0 ]; then

    echo "$(date '+%H:%M:%S') Executing npm ci as either missing all dependencies or some (${missing}) unmet dependencies..."
    npm ci --no-audit --include-workspace-root

  fi
fi

echo "$(date '+%H:%M:%S') bootstrap.sh complete"
