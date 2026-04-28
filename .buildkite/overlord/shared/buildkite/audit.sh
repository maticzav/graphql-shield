#!/bin/bash

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

set -ex

SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

mkdir -p ${SYSTEM_DIR}/components ${SYSTEM_DIR}/frontends ${SYSTEM_DIR}/libs ${SYSTEM_DIR}/packages

cat <<-END > steps.yaml.$$
  - group: ':closed_lock_with_key: Security Audits'
    steps:
END

find ${SYSTEM_DIR}/components ${SYSTEM_DIR}/frontends ${SYSTEM_DIR}/libs ${SYSTEM_DIR}/packages -maxdepth 2 -type f -name docker-compose.yaml |

while read f
do
  module=$(cd $(dirname $f); basename $(pwd))
  module_type=$(echo $f | awk -F / '{ type=NF-2; print $type }')

  if ! _should_build "${module_type}/${module}/"; then
    continue
  fi

  cat <<-END >> steps.yaml.$$
      - label: ':closed_lock_with_key: audit - ${module}'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/audit.sh ${module_type}/${module}/docker-compose.yaml"
        timeout_in_minutes: 30
        soft_fail:
          - exit_status: 3
END

done

if [ $(wc -l < steps.yaml.$$) -gt 2 ]; then
  if [ -z "$BUILDKITE" ]; then
    cat steps.yaml.$$
  else
    buildkite-agent pipeline upload steps.yaml.$$
  fi
fi

rm steps.yaml.$$
