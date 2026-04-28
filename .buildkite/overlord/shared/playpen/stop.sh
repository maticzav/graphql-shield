#!/bin/bash

set -e

PROJECT_ROOT=$(git rev-parse --show-toplevel)

COMPOSE_PROJECT_NAME=$(basename $PROJECT_ROOT)-playpen

docker compose -p $COMPOSE_PROJECT_NAME down --volumes --remove-orphans
