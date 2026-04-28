#!/bin/bash

ssm_name="/buildkite/${BUILDKITE_PIPELINE_SLUG}/${BUILDKITE_BRANCH}/git-sha"

diff_file_name="git-diff.txt"

_create_git_diff() {
  if git_sha_json=$(AWS_DEFAULT_REGION="us-west-2" aws ssm get-parameter --name "${ssm_name}" 2>/dev/null); then
    git_sha=$(echo "$git_sha_json" | awk -F'"' '/Value/ { print $(NF-1) }')
  fi

  if [ -n "${git_sha}" ]; then
    # turn off -e in case git history was re-written that made previously record sha is no longer valid
    set +e

    echo "--- :git: Generating git diff"
    echo "Files changed since last build on ${BUILDKITE_BRANCH}:"
    git diff --name-only $git_sha $BUILDKITE_COMMIT | tee $diff_file_name

    if [ $? -ne 0 ]; then
      echo "--- git diff failed, this is going to be a full build"
      return 0
    fi
    git diff --name-only $git_sha $BUILDKITE_COMMIT | grep -- '-beef' | sed -e's#components/\(.*\)-beef/.*#frontends/\1/#' | sort -u >> $diff_file_name
  else
    echo "--- No git sha in ssm, this is going to be a full build"
    return 0
  fi

  set -e

  # Anything other than components, packages, frontends dirs or buildkite/pipeline file changed,
  # then don't bother upload the diff file as this will be a full build
  if grep -q -E -v "^components|^frontends|^packages|^.buildkite/pipeline|^README.md|^.gitignore" $diff_file_name; then
    echo "--- This is going to be a full build."
  else
    echo "--- Upload $diff_file_name for incremental build"
    buildkite-agent artifact upload $diff_file_name
  fi
}

_download_git_diff() {

  if [ -z "$BUILDKITE" ]; then
    return 0
  fi

  echo "download $diff_file_name"
  rm -rf /tmp/$diff_file_name
  buildkite-agent artifact download $diff_file_name /tmp/ || echo
}

_save_git_sha() {
  AWS_DEFAULT_REGION="us-west-2" aws ssm put-parameter --overwrite --name "${ssm_name}" --type "String" --value "$BUILDKITE_COMMIT"
}

_should_build() {

  if [ ! -f /tmp/$diff_file_name ]; then
    return 0
  fi

  grep -q "^$1" /tmp/$diff_file_name
}
