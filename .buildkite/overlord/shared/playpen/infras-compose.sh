#!/bin/bash

set -e

PROJECT_ROOT=$(git rev-parse --show-toplevel)

export COMPOSE_PROJECT_NAME=$(basename "$PROJECT_ROOT")-playpen

COMPOSE_FILE=${PROJECT_ROOT}/playpen/docker-compose.yaml

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Warning: ${COMPOSE_FILE} is not a file"
  exit 0
fi

while getopts "p:f:" opt; do
  case $opt in
    p)
      profile=$OPTARG
      ;;
    f)
      fast=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done
shift $((OPTIND-1))

if [[ "$*" =~ "up" ]] ; then

  service_count=$(PROJECT_ROOT=${PROJECT_ROOT} docker compose -f "$COMPOSE_FILE" --profile "$profile" config --services | wc -l | tr -d ' ')

  if [[ $service_count == 0 ]] ; then
    echo "No services exist for profile '$profile'."
    exit 0
  fi
fi

if [[ "$fast" == "no" && "$*" =~ "up" ]] ; then

  if [[ -n "$profile" ]] ; then

    echo "Pulling all images for profile: ${profile}..."
    PROJECT_ROOT=${PROJECT_ROOT} docker compose -f "$COMPOSE_FILE" --profile "${profile}" pull

  else

    echo "Pulling untagged siteminder images..."

    compose_services=( $(PROJECT_ROOT=${PROJECT_ROOT} docker compose -f "$COMPOSE_FILE" config --services) )

    for service in "${compose_services[@]}"; do

      ecr_images=( $(PROJECT_ROOT=${PROJECT_ROOT} docker compose -f "$COMPOSE_FILE" config "$service" --images | grep 'dkr.ecr') )

      for image in "${ecr_images[@]}"; do

        # extract tag
        img_tag=$(echo "$image" | awk -F: '{ print $NF }')

        # exit if variable substitution is found
        echo "$img_tag" | grep -F '$' >/dev/null && continue

        count=$(echo "$img_tag" | grep -E -v "v[0-9]*\.[0-9]*\.[0-9]*" | wc -l)
        if [ $count -ne 0 ]; then
          PROJECT_ROOT=${PROJECT_ROOT} docker compose -f "$COMPOSE_FILE" pull "$service"
        fi
      done
    done

  fi

fi

if [[ -n "$profile" ]] ; then

  PROJECT_ROOT=${PROJECT_ROOT} docker compose -f "$COMPOSE_FILE" --profile "${profile}" "$@"

else

  PROJECT_ROOT=${PROJECT_ROOT} docker compose -f "$COMPOSE_FILE" "$@"

fi
