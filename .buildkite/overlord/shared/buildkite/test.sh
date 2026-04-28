#!/bin/bash

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

set -ex

_download_git_diff

SYSTEM_DIR=$(git rev-parse --show-toplevel)
OVERLORD_DIR=$(cd $SCRIPTDIR/../..; pwd)
RELATIVE_OVERLORD_PATH=${OVERLORD_DIR#${SYSTEM_DIR}/}

mkdir -p ${SYSTEM_DIR}/components ${SYSTEM_DIR}/frontends ${SYSTEM_DIR}/libs ${SYSTEM_DIR}/packages

cat <<-END > steps.yaml.$$
  - group: 'tests'
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

  PKG_JSON_PATH="${module_type}/${module}/package.json"

  if [[ -f "$PKG_JSON_PATH" && $(cat $PKG_JSON_PATH | jq 'has("jestParallelism")') == "true" ]]; then
    jq -c '.jestParallelism[]' $PKG_JSON_PATH | while read row; do
      COMMAND="$(echo "$row" | jq '.command')"

      if [[ -z "$COMMAND" ]]; then
        echo "command is not defined in jestParallelism entry, defaulting to test:parallel"
        COMMAND="npm run test:parallel"
      fi

      PARALLELISM="$(echo "$row" | jq '.parallelism')"

      if [[ -z "$PARALLELISM" ]]; then
        echo "parallelism is not defined in jestParallelism entry, defaulting to 2"
        PARALLELISM="2"
      fi

  cat <<-YAML >> steps.yaml.$$
      - label: '🧪 test - ${module} [queue=${BUILDKITE_AGENT_META_DATA_QUEUE}]'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/test.sh ${module_type}/${module}/docker-compose.yaml"
        agents:
          queue: "${BUILDKITE_AGENT_META_DATA_QUEUE}"
        parallelism: $((PARALLELISM))
        env:
          TEST_COMMAND: ${COMMAND}
        retry:
          automatic:
          - exit_status: -1 # Agent was lost
            limit: 1
          - exit_status: 1  # Test failure
            limit: 1
          # No other exit codes supported, e.g. exit code 2 is used for non-recoverable errors e.g. compile failures
        timeout_in_minutes: 30
        artifact_paths:
          - "${module_type}/${module}/test/logs/*.log"
          - "${module_type}/${module}/test/logs/*.tar.gz"

YAML

    done
  else

  cat <<-END >> steps.yaml.$$
      - label: 'test - ${module} [queue=${BUILDKITE_AGENT_META_DATA_QUEUE}]'
        command: "./${RELATIVE_OVERLORD_PATH}/shared/ci-scripts/test.sh ${module_type}/${module}/docker-compose.yaml"
        agents:
          queue: "${BUILDKITE_AGENT_META_DATA_QUEUE}"
        retry:
          automatic:
          - exit_status: -1 # Agent was lost
            limit: 1
          - exit_status: 1  # Test failure
            limit: 1
          # No other exit codes supported, e.g. exit code 2 is used for non-recoverable errors e.g. compile failures
        timeout_in_minutes: 30
        artifact_paths:
          - "${module_type}/${module}/test/logs/*.log"
          - "${module_type}/${module}/test/logs/*.tar.gz"

END
  fi
done

if [ $(wc -l < steps.yaml.$$) -gt 2 ]; then
  if [ -z "$BUILDKITE" ]; then
    cat steps.yaml.$$
  else
    buildkite-agent pipeline upload steps.yaml.$$
  fi
fi

rm steps.yaml.$$
