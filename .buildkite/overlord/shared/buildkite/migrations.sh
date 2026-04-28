#!/bin/bash

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

if [ -z "$BUILDKITE" ]; then
  buildkite-agent() {
    xargs echo
  }
fi

set -ex

SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

mkdir -p ${SYSTEM_DIR}/libs ${SYSTEM_DIR}/migrations

cat <<-END > steps.yaml.$$
  - group: 'build migrations'
    steps:
END

find ${SYSTEM_DIR}/libs -type f -name Dockerfile.*-migrations -maxdepth 2 |

while read f
do
  module=$(cd $(dirname $f); basename $(pwd))
  module_type=$(echo $f | awk -F / '{ type=NF-2; print $type }')

  migration_image_name="${f##*Dockerfile.}"

  if ! _should_build "${module_type}/${module}/"; then
    continue
  fi

  if [[ -n "$BUILDKITE_TAG" && "$BUILDKITE_TAG" =~ ^$module.v[0-9]+\.[0-9]+\.[0-9]+$ ]] ; then
    echo "Tag $BUILDKITE_TAG is not used for generating migrations. Skipping..."
    continue
  fi

  cat <<-END >> steps.yaml.$$
      - label: '${module}: build ${migration_image_name}'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/build-migrations.sh ${module_type}/${module}/$(basename $f)"
        timeout_in_minutes: 30

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
