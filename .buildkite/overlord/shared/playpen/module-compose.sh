#!/bin/bash

if [ $# -lt 3 ]; then
  echo "Usage: $(basename $0) <docker-compose-file> <override-modes> <command>"
  exit 1
fi

set -e

PROJECT_ROOT=$(git rev-parse --show-toplevel)

export COMPOSE_PROJECT_NAME=$(basename $PROJECT_ROOT)-playpen

COMPOSE_FILE=$1
OVERRIDE_MODES_ARG=$2

MODULE_DIR=$(dirname "$COMPOSE_FILE")
pushd "$MODULE_DIR"
MODULE=$(basename "$PWD")
popd

shift 2

FILE_ARGS="-f $COMPOSE_FILE"

if [ -n "$OVERRIDE_MODES_ARG" ]; then
  IFS=',' read -ra OVERRIDE_MODES <<< "$OVERRIDE_MODES_ARG"

  for mode in "${OVERRIDE_MODES[@]}"
  do
    compose_file_override=$(dirname $COMPOSE_FILE)/$(basename $COMPOSE_FILE .yaml).${mode}.yaml
    if [ -f "$compose_file_override" ]; then
      FILE_ARGS="$FILE_ARGS -f $compose_file_override"
    fi
  done
fi

PROJECT_ROOT=${PROJECT_ROOT} MODULE=${MODULE} docker compose $FILE_ARGS "$@"
