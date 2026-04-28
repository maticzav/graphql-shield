#!/bin/bash

set -e

registry_id='278521702583'
ecr_location="${registry_id}.dkr.ecr.us-west-2.amazonaws.com"
status_code=0

for file in $(find components libs frontends packages -maxdepth 3 -type f -iname docker* 2>/dev/null); do
  for repository_with_tag in $(egrep -o "${ecr_location}.*:.*$" $file); do

    repository=$(echo $repository_with_tag | cut -d: -f1)
    tag=$(echo $repository_with_tag | cut -d: -f2)
    repo_name=$(echo $repository | sed -e "s/${ecr_location}\///g")

    latest=$(aws ecr describe-images --registry-id=$registry_id --repository-name=$repo_name | jq --raw-output '[ .imageDetails[] | select(.imageTags | length > 0) | .imageTags[] ] | map( select( test("^v[0-9]*\\.[0-9]+\\.[0-9]+$") ) | { version: . ,precedence: (ltrimstr("v") | split(".") | map(tonumber)) }) | sort_by(.precedence) | last | .version')

    if [ "${tag}" \< "${latest}" ]; then
      echo "${file} ${repo_name} ${tag} -> ${latest}"
      status_code=$((status_code+1))
    fi
  done
done

if [ $status_code -ne 0 ]; then
  exit 3
fi
