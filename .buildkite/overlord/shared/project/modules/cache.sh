#!/usr/bin/env bash

cache_exists() {

  local cache_key="$1"

  if aws s3api head-object --bucket sm.build-artifacts.cache --key "$cache_key.tar.gz" >/dev/null 2>&1 ; then
    return 0
  fi

  return 1
}

# To test add 'aws --endpoint-url=http://localstack:4566' to use localstack
save_cache() {

  local cache_key="$1"
  local cache_dir="$2"
  local s3_url="s3://sm.build-artifacts.cache/${cache_key}.tar.gz"

  # cater for race conditions with parallel build.
  if cache_exists "$cache_key" ; then
    return
  fi

  if [[ -d "$cache_dir" ]] ; then

    echo "$(date '+%H:%M:%S') Archiving $cache_dir: ${cache_key}.tar.gz..."
    tar -czf "${cache_key}.tar.gz" "$cache_dir"

    local cache_size=$(du -sh -- "${cache_key}.tar.gz" | tr -d ' ' | cut -f 1)

    echo "$(date '+%H:%M:%S') Uploading $s3_url ($cache_size)..."
    aws s3 cp "${cache_key}.tar.gz" s3://sm.build-artifacts.cache/ >/dev/null

    rm "${cache_key}.tar.gz"

  fi

}

# To test add 'aws --endpoint-url=http://localstack:4566' to use localstack
restore_cache() {

  local cache_key="$1"
  local cache_dir="$2"
  local s3_url="s3://sm.build-artifacts.cache/${cache_key}.tar.gz"

  if [ $# -eq 3 ]; then
    local restore_location="$3"
  fi

  if cache_exists "$cache_key" ; then

    echo "$(date '+%H:%M:%S') Downloading $s3_url"
    aws s3 cp "$s3_url" . >/dev/null

    local cache_size=$(du -sh -- "${cache_key}.tar.gz" | tr -d ' ' | cut -f 1)

    if [ -n "$restore_location" ]; then
      echo "$(date '+%H:%M:%S') Restoring $cache_dir ($cache_size) to $restore_location..."
    else
      echo "$(date '+%H:%M:%S') Restoring $cache_dir ($cache_size)..."
    fi
    tar -xzf "${cache_key}.tar.gz" "$cache_dir"
    rm "${cache_key}.tar.gz"

  fi
}
