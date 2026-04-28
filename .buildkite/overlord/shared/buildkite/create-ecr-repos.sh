#!/bin/bash

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

SYSTEM_DIR=$(git rev-parse --show-toplevel)

mkdir -p ${SYSTEM_DIR}/components ${SYSTEM_DIR}/libs

cat <<-END > steps.yaml.$$
  - group: 'Create ecr repos'
    steps:
END

find ${SYSTEM_DIR}/components ${SYSTEM_DIR}/libs -maxdepth 2 -type f -name Dockerfile -o -name Dockerfile.app -o -name Dockerfile.*-migrations |

while read f
do
  module=$(cd $(dirname $f); basename $(pwd))
  module_type=$(echo $f | awk -F / '{ type=NF-2; print $type }')

  if ! _should_build "${module_type}/${module}/"; then
    continue
  fi

  ecr_repo="${BUILDKITE_PIPELINE_SLUG}/${module}"
  aws ecr describe-repositories --repository-name=${ecr_repo} >/dev/null 2>/dev/null

  if [ $? -eq 0 ]; then
    continue
  fi

  cat <<-END >> steps.yaml.$$
      - label: 'Create ecr repo ${ecr_repo}'
        trigger: 'aws-build'
        build:
          branch: master
          env:
            SM_ECR_CREATE: "${ecr_repo}"

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
