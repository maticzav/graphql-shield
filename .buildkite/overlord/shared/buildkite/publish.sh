#!/bin/bash

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

set -e

SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

mkdir -p ${SYSTEM_DIR}/libs ${SYSTEM_DIR}/packages

cat <<-END > steps.yaml.$$
  - group: 'npm publish'
    steps:
END

find ${SYSTEM_DIR}/libs ${SYSTEM_DIR}/packages -maxdepth 2 -type f -name docker-compose.yaml |

while read f
do
  module=$(cd $(dirname $f); basename $(pwd))
  module_type=$(echo $f | awk -F / '{ type=NF-2; print $type }')

  if ! _should_build "${module_type}/${module}/"; then
    continue
  fi

  echo "Parsing $module_type/$module/package.json"

  if [ ! -f ${module_type}/${module}/package.json ]; then
    echo "no package.json, skipping"
    continue
  fi

  smpublish=$(jq '.scripts.smpublish' ${module_type}/${module}/package.json)
  publish=$(jq '.scripts.publish' ${module_type}/${module}/package.json)

  if [[ "$smpublish" == "null" && "$publish" == "null" ]]; then
    echo "no npm run smpublish or npm run publish. skip"
    continue
  fi

  if [[ "$smpublish" != "null" ]]; then
    cat <<-END >> steps.yaml.$$
      - label: 'npm publish - ${module}'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/smpublish.sh ${module_type}/${module}/docker-compose.yaml"
        timeout_in_minutes: 30

END

  elif [[ "$publish" != "null" ]]; then

    echo "WARNING: \"publish\" script is no longer supported in ${module_type}/${module}/package.json. Change it to \"smpublish\". The generated step will fail."

    cat <<-END >> steps.yaml.$$
      - label: 'npm publish - ${module}'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/publish.sh ${module_type}/${module}/docker-compose.yaml"
        timeout_in_minutes: 30

END

  fi

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
