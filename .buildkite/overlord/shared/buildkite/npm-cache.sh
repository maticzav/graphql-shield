#!/usr/bin/env bash

SCRIPTDIR=$(dirname "$0")

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

set -e

SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

mkdir -p "${SYSTEM_DIR}/components" "${SYSTEM_DIR}/frontends" "${SYSTEM_DIR}/libs" "${SYSTEM_DIR}/packages"

cat <<-END > steps.yaml.$$
  - group: ':npm: npm cache'
    steps:
END

find "${SYSTEM_DIR}/components" "${SYSTEM_DIR}/frontends" "${SYSTEM_DIR}/libs" "${SYSTEM_DIR}/packages" -maxdepth 2 -type f -name docker-compose.yaml |

while read f
do
  module=$(cd "$(dirname "$f")"; basename "$(pwd)")
  module_type=$(echo "$f" | awk -F / '{ type=NF-2; print $type }')

  if ! _should_build "${module_type}/${module}/"; then
    continue
  fi

  echo "Parsing $module_type/$module/package.json"

  if [ ! -f "${module_type}/${module}/package.json" ]; then
    continue
  fi

  dependencies=$(jq '.dependencies' "${module_type}/${module}/package.json")
  peer_dependencies=$(jq '.peerDependencies' "${module_type}/${module}/package.json")
  dev_dependencies=$(jq '.devDependencies' "${module_type}/${module}/package.json")

  if [[ "$dependencies" == "null" && "$peer_dependencies" == "null" && "$dev_dependencies" == "null" ]]; then
    echo "${module_type}/${module}/package.json: no 'dependencies', 'peerDependencies' or 'devDependencies'. skip"
    continue
  fi

  cat <<-END >> steps.yaml.$$
      - label: ':npm: npm cache - ${module} [queue=${BUILDKITE_AGENT_META_DATA_QUEUE}]'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/npm-cache.sh ${module_type}/${module}/docker-compose.yaml"
        agents:
          queue: "${BUILDKITE_AGENT_META_DATA_QUEUE}"
        timeout_in_minutes: 30
        soft_fail:
        - exit_status: 2

END

  echo

done

if [ $(wc -l < steps.yaml.$$) -gt 2 ]; then
  if [ -z "$BUILDKITE" ]; then
    cat steps.yaml.$$
  else
    buildkite-agent pipeline upload steps.yaml.$$
  fi
fi

rm steps.yaml.$$
