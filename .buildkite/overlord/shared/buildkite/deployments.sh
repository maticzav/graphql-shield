#!/usr/bin/env bash

usage() {
  echo "Usage: $(basename $0) -r <dev|prod|pciprod> [-e <environment>] [--app-infras-branch <branch>] [--config-branch <branch>] [-R <region>] [--include <pattern>] [--exclude <pattern>] [--deploy-version <build|branch|branch-dynamic|none>]"
  exit 1
}

_error() {
  echo -e "\033[1;31m${1}\033[0m"
  exit 1
}

skip_config_check_arg=false
deploy_version_arg="build"

while getopts ":i:e:r:e:R:s-:" opt; do
  case $opt in
    -)
      case "${OPTARG}" in
        app-infras-branch)
          app_infras_branch="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
          if [ -z "${app_infras_branch}" ]; then
            _error "value is required for --app-infras-branch"
          fi
          ;;
        config-branch)
          config_branch_arg="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
          if [ -z "${config_branch_arg}" ]; then
            _error "value is required for --config-branch"
          fi
          ;;
        exclude)
          exclude_pattern="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
          if [ -z "${exclude_pattern}" ]; then
            _error "value is required for --exclude"
          fi
          ;;
        include)
          include_pattern="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
          if [ -z "${include_pattern}" ]; then
            _error "value is required for --include"
          fi
          ;;
        deploy-version)
          deploy_version_arg="${!OPTIND}"; OPTIND=$(( OPTIND + 1 ))
          if [ -z "${deploy_version_arg}" ]; then
            _error "value is required for --deploy-version"
          elif [[ "$deploy_version_arg" != "build" && "$deploy_version_arg" != "branch" && "$deploy_version_arg" != "branch-dynamic" && "$deploy_version_arg" != "none" ]]; then
            _error "--deploy-version must be build, branch, branch-dynamic or none"
          fi

          ;;
        *)
          if [ "$OPTERR" = 1 ] && [ "${optspec:0:1}" != ":" ]; then
            _error "Unknown option --${OPTARG}" >&2
          fi
          ;;
      esac;;
    r)
      realm=${OPTARG}
      ;;
    e)
      environment=${OPTARG}
      ;;
    R)
      region=${OPTARG}
      ;;
    s)
      skip_config_check_arg=true
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
  esac
done
shift $((OPTIND-1))

SCRIPTDIR=$(dirname $0)

. "${SCRIPTDIR}/modules/git-sha.sh"

_download_git_diff

if [ -z "$realm" ]; then
  usage
fi

set -e

deploy_cmd="${SCRIPTDIR}/deploy.sh -r ${realm}"

if [ -n "$app_infras_branch" ]; then
  deploy_cmd="${deploy_cmd} -i $app_infras_branch"
fi

if [ -n "$config_branch_arg" ]; then
  deploy_cmd="${deploy_cmd} -b $config_branch_arg"
fi

if [ "$skip_config_check_arg" == "true" ]; then

  if [ -z "$environment" ]; then
    _error "'-s' cannot be set without '-e'"
  fi

  if [[ "$deploy_version_arg" == "branch-dynamic" ]]; then
    _error "--deploy-version branch-dynamic cannot be set with '-s'"
  fi

  deploy_cmd="${deploy_cmd} -s"
fi

if [ -n "$region" ]; then
  if [ -z "$environment" ]; then
    _error "'-R' cannot be set without '-e'"
  fi
fi

SYSTEM_DIR=$(git rev-parse --show-toplevel)

SYSTEM_NAME=$(basename $SYSTEM_DIR)
SYSTEM_INFRAS_REPO="${SYSTEM_NAME}-infrastructure"
SYSTEM_INFRAS_REPO_PATH="${SYSTEM_DIR}/${SYSTEM_INFRAS_REPO}.$$"

echo "~~~ Cloning $SYSTEM_INFRAS_REPO..."
rm -rf $SYSTEM_INFRAS_REPO_PATH

if [ -n "$app_infras_branch" ]; then
  git clone git@github.com:siteminder-au/${SYSTEM_INFRAS_REPO}.git -b "$app_infras_branch" --depth 1 $SYSTEM_INFRAS_REPO_PATH
else
  git clone git@github.com:siteminder-au/${SYSTEM_INFRAS_REPO}.git --depth 1 $SYSTEM_INFRAS_REPO_PATH
fi

SYSTEM_CONFIG_REPO="${SYSTEM_NAME}-config-${realm}"
SYSTEM_CONFIG_REPO_PATH="${SYSTEM_DIR}/${SYSTEM_CONFIG_REPO}.$$"

if [ "$skip_config_check_arg" == "false" ]; then

  echo "~~~ Cloning $SYSTEM_CONFIG_REPO..."
  rm -rf $SYSTEM_CONFIG_REPO_PATH

  if [ -n "$config_branch_arg" ]; then
    git clone git@github.com:siteminder-au/${SYSTEM_CONFIG_REPO}.git -b "$config_branch_arg" --depth 1 $SYSTEM_CONFIG_REPO_PATH
  else
    git clone git@github.com:siteminder-au/${SYSTEM_CONFIG_REPO}.git --depth 1 $SYSTEM_CONFIG_REPO_PATH
  fi

fi

# Set BUILDKITE_BUILD_NUMBER if not already set.
: ${BUILDKITE_BUILD_NUMBER:=$(date "+%Y%m%d_%H%M%S")}

. "${SCRIPTDIR}/modules/deployments/dynamic.sh"
. "${SCRIPTDIR}/modules/deployments/components.sh"
. "${SCRIPTDIR}/modules/deployments/migrations.sh"
. "${SCRIPTDIR}/modules/deployments/frontends.sh"

mkdir -p ${SYSTEM_DIR}/components ${SYSTEM_DIR}/libs ${SYSTEM_DIR}/frontends ${SYSTEM_DIR}/migrations

cat <<-END > steps.yaml.$$
  - group: 'deployments ${realm}/${environment} ${region}'
    steps:
END

echo "+++ Deploy Components"
find ${SYSTEM_DIR}/components -maxdepth 2 -type f -name docker-compose.yaml |
while read f; do

  if [ -n "$include_pattern" ]; then
    if [[ ! "$f" =~ $include_pattern ]]; then
      continue
    fi
  fi

  if [ -n "$exclude_pattern" ]; then
    if [[ "$f" =~ $exclude_pattern ]]; then
      continue
    fi
  fi

  c=$(cd $(dirname $f); basename $(pwd))

  if ! _should_build "components/${c}/"; then
    continue
  fi

  if [ -n "$environment" ]; then

    _deploy_component "$environment" "$c" "$region"

  else

    # detect environments

    _load_configured_environments_for_component "$c" |
    while read environment; do

      if _component_has_configured_region_for_environment "$environment" "$c"; then

        _load_configured_regions_for_environment_component "$environment" "$c" |
        while read region; do

          _deploy_component "$environment" "$c" "$region"

        done

      else

        _deploy_component "$environment" "$c"

      fi

    done

  fi

done

echo "+++ Deploy Migrations"
find ${SYSTEM_DIR}/libs -maxdepth 2 -type f -name Dockerfile.*-migrations |
while read f; do

  if [ -n "$include_pattern" ]; then
    if [[ ! "$f" =~ $include_pattern ]]; then
      continue
    fi
  fi

  if [ -n "$exclude_pattern" ]; then
    if [[ "$f" =~ $exclude_pattern ]]; then
      continue
    fi
  fi

  module=$(cd $(dirname $f); basename $(pwd))

  if ! _should_build "libs/${module}/"; then
    continue
  fi

  if [[ -n "$BUILDKITE_TAG" && "$BUILDKITE_TAG" =~ ^$module.v[0-9]+\.[0-9]+\.[0-9]+$ ]] ; then
    continue
  fi

  migration_image_name="${f##*Dockerfile.}"

  if [ -n "$environment" ]; then

    _deploy_migrations "$environment" "$migration_image_name" "$region"

  else

    # detect environments

    _load_configured_environments_for_component "$migration_image_name" |
    while read environment; do

      if _component_has_configured_region_for_environment "$environment" "$migration_image_name"; then

        _load_configured_regions_for_environment_component "$environment" "$migration_image_name" |
        while read region; do

          _deploy_migrations "$environment" "$migration_image_name" "$region"

        done

      else

        _deploy_migrations "$environment" "$migration_image_name"

      fi

    done

  fi

done

echo "+++ Deploy Frontends"
find ${SYSTEM_DIR}/frontends -maxdepth 2 -type f -name docker-compose.yaml |
while read f; do

  if [ -n "$include_pattern" ]; then
    if [[ ! "$f" =~ $include_pattern ]]; then
      continue
    fi
  fi

  if [ -n "$exclude_pattern" ]; then
    if [[ "$f" =~ $exclude_pattern ]]; then
      continue
    fi
  fi

  c=$(cd $(dirname $f); basename $(pwd))

  if ! _should_build "frontends/${c}/"; then
    continue
  fi

  if [ -n "$environment" ]; then

    _deploy_frontend "$environment" "$c" "$region"

  else

    # detect environments

    _load_configured_environments_for_component "$c" |
    while read environment; do

      if _component_has_configured_region_for_environment "$environment" "$c"; then

        _load_configured_regions_for_environment_component "$environment" "$c" |
        while read region; do

          _deploy_frontend "$environment" "$c" "$region"

        done

      else

        _deploy_frontend "$environment" "$c"

      fi

    done
  fi

done

echo
echo "~~~ Cleaning up cloned $SYSTEM_INFRAS_REPO..."
rm -rf $SYSTEM_INFRAS_REPO_PATH

if [ "$skip_config_check_arg" == "false" ]; then
  echo "~~~ Cleaning up cloned $SYSTEM_CONFIG_REPO..."
  rm -rf $SYSTEM_CONFIG_REPO_PATH
fi

if [ $(wc -l < steps.yaml.$$) -gt 2 ]; then
  if [ -z "$BUILDKITE" ]; then
    cat steps.yaml.$$
  else
    buildkite-agent pipeline upload steps.yaml.$$
  fi
fi

rm steps.yaml.$$
