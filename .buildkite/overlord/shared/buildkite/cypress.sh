#!/bin/bash

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

set -ex

SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

mkdir -p ${SYSTEM_DIR}/frontends

cat <<-END > steps.yaml.$$
  - group: 'cypress'
    steps:
END

find ${SYSTEM_DIR}/frontends -maxdepth 2 -type f -name docker-compose.yaml |

while read f
do
  module=$(cd $(dirname $f); basename $(pwd))
  module_type=$(echo $f | awk -F / '{ type=NF-2; print $type }')

  if ! _should_build "${module_type}/${module}/"; then
    continue
  fi

  if [ ! -f ${module_type}/${module}/package.json ]; then
    echo "no package.json, skipping"
    continue
  fi

  cypress=$(jq '.scripts.cypress' ${module_type}/${module}/package.json)

  if [ "$cypress" == "null" ]; then
    echo "no npm run cypress. skip"
    continue
  fi

  ls ${module_type}/${module}/test/end-to-end/integration/*.spec.ts | while read cypress_suite_file
  do
    cypress_suite_name=$(basename $cypress_suite_file .spec.ts)

    cat <<-END >> steps.yaml.$$
        - label: 'cypress - ${module} ${cypress_suite_name} [queue=${BUILDKITE_AGENT_META_DATA_QUEUE}]'
          command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/cypress.sh ${module_type}/${module}/docker-compose.yaml test/end-to-end/integration/${cypress_suite_name}.spec.ts test/harness/${cypress_suite_name}.ts"
          agents:
            queue: "${BUILDKITE_AGENT_META_DATA_QUEUE}"
          artifact_paths:
            - "${module_type}/${module}/test/end-to-end/videos/*.mp4"
            - "${module_type}/${module}/test/end-to-end/logs/*.log"
            - "${module_type}/${module}/test/end-to-end/screenshots/**/*.png"
          retry:
            automatic:
            - exit_status: -1 # Agent was lost
              limit: 1
            - exit_status: 1  # Test failure
              limit: 1
            # No other exit codes supported, e.g. exit code 2 is used for non-recoverable errors e.g. compile failures
          timeout_in_minutes: 30

END
  done

done

if [ $(wc -l < steps.yaml.$$) -gt 2 ]; then
  if [ -z "$BUILDKITE" ]; then
    cat steps.yaml.$$
  else
    buildkite-agent pipeline upload steps.yaml.$$
  fi
fi

rm steps.yaml.$$
