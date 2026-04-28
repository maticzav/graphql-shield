#!/usr/bin/env bash

_deploy_migrations() {

  # Clear out version variable so it isn't used for next component
  unset version
  unset config_deploy_version
  unset local_deploy_cmd

  environment="$1"
  migration_image_name="$2"
  region="$3"

  if [ -n "${BUILDKITE_TAG}" ]; then
    version="${migration_image_name}-${BUILDKITE_TAG:1}"
  elif [ "$deploy_version_arg" == "build" ]; then
    version="${migration_image_name}-${BUILDKITE_BUILD_NUMBER}"
  elif [[ "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then
    version="${migration_image_name}-${BUILDKITE_BRANCH//\//_}"
  fi

  deployment_type=helm
  if [ -d "${SYSTEM_INFRAS_REPO_PATH}/${migration_image_name}" ] && [ ! -d "${SYSTEM_INFRAS_REPO_PATH}/${migration_image_name}-app" ]; then
    deployment_type=terraform
  fi

  # Check if version to deploy matches, exit if not
  if [[ "$deploy_version_arg" == "branch-dynamic" ]]; then

    if [[ $deployment_type == "terraform" ]]; then

      # Globbing is desired here
      # shellcheck disable=SC2086
      config_deploy_version=$(egrep -h -s "lambda_code_key|app_version" ${SYSTEM_CONFIG_REPO_PATH}/${migration_image_name}{,-inf}/${environment}/${region}/terraform.tfvars | tr -d ' ' | tr -d '"' | tr -d "'" | cut -d '=' -f2)

      if [[ -z "${config_deploy_version}" ]] ; then
        echo
        echo "Skipping deploy of ${migration_image_name} to ${environment} ${region} as version is not set in terraform.tfvars" | tr -s ' '
        return
      elif [[ "${config_deploy_version}" != "$version" ]] ; then
        echo
        echo "Skipping deploy of ${migration_image_name} to ${environment} ${region} as version locked to $config_deploy_version in terraform.tfvars" | tr -s ' '
        return
      fi

    elif [[ $deployment_type == "helm" ]]; then

      # Globbing is desired here
      # shellcheck disable=SC2086
      config_deploy_version=$(grep -h -s "tag:" ${SYSTEM_CONFIG_REPO_PATH}/${migration_image_name}{,-app}/${environment}/${region}/helm.yaml | tr -d ' ' | tr -d '"' | tr -d "'" | cut -d ':' -f2)

      if [[ -z "${config_deploy_version}" ]] ; then
        echo
        echo "Skipping deploy of ${migration_image_name} to ${environment} ${region} as version is not set in helm.yaml" | tr -s ' '
        return
      elif [[ "${config_deploy_version}" != "$version" ]] ; then
        echo
        echo "Skipping deploy of ${migration_image_name} to ${environment} ${region} as version locked to $config_deploy_version in helm.yaml" | tr -s ' '
        return
      fi

    fi

  fi

  local_deploy_cmd="${deploy_cmd} -e ${environment} -c ${migration_image_name} -t ${deployment_type}"

  if [ -n "$region" ]; then
    local_deploy_cmd="${local_deploy_cmd} -R ${region}"
  fi

  if [[ "$deploy_version_arg" == "build" || "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then
    label_str=":helm: Trigger deploy - ${module} ${migration_image_name} ${version} to ${realm}.${environment} ${region}"
    command_str="${local_deploy_cmd} -V \"${version}\""
  else
    label_str=":helm: Trigger deploy - ${module} ${migration_image_name} to ${realm}.${environment} ${region}"
    command_str="${local_deploy_cmd}"
  fi

  echo
  echo "Generating $label_str"

  $command_str >> steps.yaml.$$

}
