#!/usr/bin/env bash

is_workspace() {

  local system_dir="$1"
  local module_dir="$2"

  if [ "$(jq '.workspaces' $system_dir/package.json)" == "null" ] ; then
    return 1
  fi

  result="NO"

  result=$(jq --raw-output '.workspaces[]' $system_dir/package.json | while read pattern
  do
    if [[ "./$module_dir" =~ $pattern ]]; then
      echo "YES"
      return 0
    fi
  done)

  if [ "$result" == "YES" ]; then
    return 0
  else
    return 1
  fi

}
