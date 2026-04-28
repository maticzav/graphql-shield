#!/usr/bin/env bash

_deploy_frontend() {

  # Clear out version variable so it isn't used for next component
  unset version
  unset config_deploy_version

  environment="$1"
  component="$2"
  region="$3"

  local_deploy_cmd="${deploy_cmd} -e ${environment} -c ${component}"

  if [ -n "$region" ]; then
    local_deploy_cmd="${local_deploy_cmd} -R ${region}"
  fi

  if [ -d "${SYSTEM_CONFIG_REPO_PATH}" ]; then

    if [ -n "$region" ]; then
      if [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}/${region}/frontend.rc" ]; then
        echo "Skipping deploy of ${component} to ${environment} ${region} as ${component}/${environment}/${region}/frontend.rc not found"
        return
      fi
    else
      if [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}/frontend.rc" ]; then
        echo "Skipping deploy of ${component} to ${environment} as ${component}/${environment}/frontend.rc not found"
        return
      fi
    fi
  fi

  if [ -n "${BUILDKITE_TAG}" ]; then
    version="${BUILDKITE_PIPELINE_SLUG}-${component}/${component}-${BUILDKITE_TAG:1}.zip"
  elif [ "$deploy_version_arg" == "build" ]; then
    version="${BUILDKITE_PIPELINE_SLUG}-${component}/${component}-build-${BUILDKITE_BUILD_NUMBER}.zip"
  elif [[ "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then
    version="${BUILDKITE_PIPELINE_SLUG}-${component}/${component}-${BUILDKITE_BRANCH//\//_}.zip"
  fi

  # Check if version to deploy matches, exit if not
  if [[ "$deploy_version_arg" == "branch-dynamic" ]]; then

    # Globbing is desired here
    # shellcheck disable=SC2086
    config_deploy_version=$(grep artifact_path ${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}/${region}/frontend.rc | tr -d ' ' | tr -d '"' | tr -d "'" | cut -d '=' -f2)

    if [[ -z "${config_deploy_version}" ]] ; then
      echo
      echo "Skipping deploy of ${component} to ${environment} ${region} as version is not set in frontend.rc" | tr -s ' '
      return
    elif [[ "${config_deploy_version}" != "$version" ]] ; then
      echo
      echo "Skipping deploy of ${component} to ${environment} ${region} as version locked to $config_deploy_version in frontend.rc" | tr -s ' '
      return
    fi
  fi

  if [[ "$deploy_version_arg" == "build" || "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then
    label_str=":cloudfront: Trigger deploy - ${component} ${version} to ${realm}.${environment} ${region}"
    command_str="${local_deploy_cmd} -t frontend -V \"${version}\""
  else
    label_str=":cloudfront: Trigger deploy - ${component} to ${realm}.${environment} ${region}"
    command_str="${local_deploy_cmd} -t frontend"
  fi

  echo
  echo "Generating $label_str"

  $command_str >> steps.yaml.$$

}
