#!/bin/bash

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

set -ex

SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

mkdir -p ${SYSTEM_DIR}/components

cat <<-END > steps.yaml.$$
  - group: ':docker: build runtime image'
    steps:
END

find ${SYSTEM_DIR}/components -maxdepth 2 -type f -name Dockerfile.runtime |

while read f
do
  module=$(cd $(dirname $f); basename $(pwd))
  module_type=$(echo $f | awk -F / '{ type=NF-2; print $type }')
  dockerfile_name=$(basename $f)

  if ! _should_build "${module_type}/${module}/"; then
    continue
  fi

  cat <<-END >> steps.yaml.$$
      - label: ':docker: build runtime image - ${module}'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/build.sh ${module_type}/${module}/${dockerfile_name} runtime-${BUILDKITE_BUILD_NUMBER}"
        timeout_in_minutes: 60

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
