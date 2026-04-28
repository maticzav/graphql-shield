#!/usr/bin/env bash

set -e

# Check required binary exists
which jq >/dev/null
which npm >/dev/null

if [ $# -ne 1 ]; then
  echo "Usage: $(basename $0) <lib-name>"
  echo "  e.g. $(basename $0) nxs-api-client"
  exit 1
fi

lib_package_json_path="../../libs/${1}/package.json"

if [ ! -f $lib_package_json_path ]; then
  echo "Error: unable to find package.json at ${lib_package_json_path}"
  exit 1
fi

echo "Installing dependencies of libs/${1}/package.json..."
jq --raw-output '.dependencies | to_entries[] | "\(.key)@\(.value)"' $lib_package_json_path | xargs npm ci
