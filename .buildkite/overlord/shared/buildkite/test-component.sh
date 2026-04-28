#!/bin/bash

if [ $# -gt 1 ]; then
  echo "Usage: $(basename $0) [test runner service]"
  echo " e.g.: $(basename $0) test-runner"
  exit 1
fi

test_service=$1

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

set -ex


SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

test_cmd="./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/test-component.sh "

mkdir -p ${SYSTEM_DIR}/components

cat <<-END > steps.yaml.$$
  - group: ':jest: execute component tests'
    steps:
END

find ${SYSTEM_DIR}/components -maxdepth 2 -type f -name docker-compose.yaml | grep -E "${include_pattern}" |

while read f
do

  if [ -n "$exclude_pattern" ]; then
    if [[ "$f" =~ $exclude_pattern ]]; then
      continue
    fi
  fi

  module=$(cd $(dirname $f); basename $(pwd))

  dockerfile_name=$(basename $f)

  if ! _should_build "components/${module}/"; then
    continue
  fi

  if [ ! -f components/${module}/package.json ]; then
    echo "no package.json, skipping"
    continue
  fi

  test_component=$(jq '.scripts."test-component"' components/${module}/package.json)

  if [ "$test_component" == "null" ]; then
    echo "no npm run test-component. skip"
    continue
  fi

  if [ -z ${BUILDKITE_TAG} ]; then
    version="build-${BUILDKITE_BUILD_NUMBER}"
  else
    version="${BUILDKITE_TAG}"
  fi

  cat <<-END >> steps.yaml.$$
      - label: ':jest: execute component tests - ${module} ${version} '
        command: "${test_cmd} components/${module}/${dockerfile_name} ${version} ${test_service}"
        artifact_paths:
          - "${module_type}/${module}/test/end-to-end/logs/*.log"
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
