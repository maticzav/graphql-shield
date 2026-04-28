#!/usr/bin/env bash

_deploy_component() {

  # Clear out version variable so it isn't used for next component
  unset version
  unset config_deploy_version
  unset local_deploy_cmd

  environment="$1"
  component="$2"
  region="$3"

  local_deploy_cmd="${deploy_cmd} -e ${environment} -c ${component}"

  if [ -n "$region" ]; then
    local_deploy_cmd="${local_deploy_cmd} -R ${region}"
  fi

  if [ -f "components/${component}/Dockerfile" -o -f "components/${component}/Dockerfile.app" ]; then

    # this is a docker deployment
    if [ -n "${BUILDKITE_TAG}" ]; then
      version="${BUILDKITE_TAG}"
    elif [ "$deploy_version_arg" == "build" ]; then
      version="build-${BUILDKITE_BUILD_NUMBER}"
    elif [[ "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then
      version="${BUILDKITE_BRANCH//\//_}"
    fi

    deployment_type=helm

    if [ -d "${SYSTEM_INFRAS_REPO_PATH}/${component}" ] && [ ! -d "${SYSTEM_INFRAS_REPO_PATH}/${component}-app" ]; then
      deployment_type=terraform
    fi

    if [ -d "${SYSTEM_INFRAS_REPO_PATH}/${component}-inf" ] && [ ! -d "${SYSTEM_INFRAS_REPO_PATH}/${component}-app" ]; then
      deployment_type=terraform
    fi

    if [ -d "${SYSTEM_CONFIG_REPO_PATH}" ]; then

      if [ -n "$region" ]; then
        if [ $deployment_type == "helm" ] && [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}-app/${environment}/${region}/helm.yaml" ]; then
          echo "Skipping deploy of ${component} to ${environment} ${region} as ${component}-app/${environment}/${region}/helm.yaml not found"
          return
        fi
      else
        if [ $deployment_type == "helm" ] && [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}-app/${environment}/helm.yaml" ]; then
          echo "Skipping deploy of ${component} to ${environment} as ${component}-app/${environment}/helm.yaml not found"
          return
        fi
      fi

      if [ -n "$region" ]; then
        if [ $deployment_type == "terraform" ] \
          && [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}/${region}/terraform.tfvars" ] \
          && [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf/${environment}/${region}/terraform.tfvars" ]; then
          echo "Skipping deploy of ${component} to ${environment} ${region} as ${component}/${environment}/${region}/terraform.tfvars & ${component}-inf/${environment}/${region}/terraform.tfvars not found"
          return
        fi
      else
        if [ $deployment_type == "terraform" ] \
          && [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}/terraform.tfvars" ] \
          && [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf/${environment}/terraform.tfvars" ]; then
          echo "Skipping deploy of ${component} to ${environment} as ${component}/${environment}/terraform.tfvars & ${component}-inf/${environment}/terraform.tfvars not found"
          return
        fi
      fi

      # Check if version to deploy matches, exit if not
      if [[ "$deploy_version_arg" == "branch-dynamic" ]]; then

        if [[ $deployment_type == "terraform" ]]; then

          # Globbing is desired here
          # shellcheck disable=SC2086
          config_deploy_version=$(egrep -h -s "lambda_code_key|app_version" ${SYSTEM_CONFIG_REPO_PATH}/${component}{,-inf}/${environment}/${region}/terraform.tfvars | tr -d ' ' | tr -d '"' | tr -d "'" | cut -d '=' -f2)

          if [[ -z "${config_deploy_version}" ]] ; then
            echo
            echo "Skipping deploy of ${component} to ${environment} ${region} as version is not set in terraform.tfvars" | tr -s ' '
            return
          elif [[ "${config_deploy_version}" != "$version" ]] ; then
            echo
            echo "Skipping deploy of ${component} to ${environment} ${region} as version locked to ${config_deploy_version} in terraform.tfvars" | tr -s ' '
            return
          fi

        elif [[ $deployment_type == "helm" ]]; then

          # Globbing is desired here
          # shellcheck disable=SC2086
          config_deploy_version=$(grep -h -s "tag:" ${SYSTEM_CONFIG_REPO_PATH}/${component}{,-app}/${environment}/${region}/helm.yaml | tr -d ' ' | tr -d '"' | tr -d "'" | cut -d ':' -f2)

          if [[ -z "${config_deploy_version}" ]] ; then
            echo
            echo "Skipping deploy of ${component} to ${environment} ${region} as version is not set in helm.yaml" | tr -s ' '
            return
          elif [[ "${config_deploy_version}" != "$version" ]] ; then
            echo
            echo "Skipping deploy of ${component} to ${environment} ${region} as version locked to ${config_deploy_version} in helm.yaml" | tr -s ' '
            return
          fi

        fi

      fi

    fi

    if [[ "$deploy_version_arg" == "build" || "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then
      label_str=":helm: Trigger deploy - ${component} ${version} to ${realm}.${environment} ${region}"
      command_str="${local_deploy_cmd} -t ${deployment_type} -V \"${version}\""
    else
      label_str=":helm: Trigger deploy - ${component} to ${realm}.${environment} ${region}"
      command_str="${local_deploy_cmd} -t ${deployment_type}"
    fi

    echo
    echo "Generating $label_str"

    $command_str >> steps.yaml.$$

  else

    # this is a lambda deployment

    if [ -d "${SYSTEM_CONFIG_REPO_PATH}" ]; then

      if [ -n "$region" ]; then
        if [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}/${region}/terraform.tfvars" ]; then
          echo "Skipping deploy of ${component} to ${environment} ${region} as ${component}/${environment}/${region}/terraform.tfvars not found"
          return
        fi
      else
        if [ ! -f "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}/terraform.tfvars" ]; then
          echo "Skipping deploy of ${component} to ${environment} as ${component}/${environment}/terraform.tfvars not found"
          return
        fi
      fi
    fi

    if [ -n "${BUILDKITE_TAG}" ]; then
      version_prefix="${BUILDKITE_PIPELINE_SLUG}-${component}/${component}-${BUILDKITE_TAG:1}"
    elif [ "$deploy_version_arg" == "build" ]; then
      version_prefix="${BUILDKITE_PIPELINE_SLUG}-${component}/${component}-build-${BUILDKITE_BUILD_NUMBER}"
    elif [[ "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then
      version_prefix="${BUILDKITE_PIPELINE_SLUG}-${component}/${component}-${BUILDKITE_BRANCH//\//_}"
    fi

    set +e

    if [[ "$deploy_version_arg" == "build" || "$deploy_version_arg" == "branch" || "$deploy_version_arg" == "branch-dynamic" ]]; then

      if aws s3 ls s3://sm.build-artifacts.build/${version_prefix}.zip >/dev/null ; then
        version=${version_prefix}.zip
      elif aws s3 ls s3://sm.build-artifacts.build/${version_prefix}.jar >/dev/null ; then
        version=${version_prefix}.jar
      fi
    fi

    # Check if version to deploy matches, exit if not
    if [[ "$deploy_version_arg" == "branch-dynamic" ]]; then

      # Globbing is desired here
      # shellcheck disable=SC2086
      config_deploy_version=$(egrep -h -s "lambda_code_key|app_version" ${SYSTEM_CONFIG_REPO_PATH}/${component}{,-inf}/${environment}/${region}/terraform.tfvars | tr -d ' ' | tr -d '"' | tr -d "'" | cut -d '=' -f2)

      if [[ -z "${config_deploy_version}" ]] ; then
        echo
        echo "Skipping deploy of ${component} to ${environment} ${region} as version is not set in terraform.tfvars" | tr -s ' '
        return
      elif [[ "${config_deploy_version}" != "$version" ]] ; then
        echo
        echo "Skipping deploy of ${component} to ${environment} ${region} as version locked to $config_deploy_version in terraform.tfvars" | tr -s ' '
        return
      fi
    fi

    set -e

    if [[ "$deploy_version_arg" == "build" || "$deploy_version_arg" == "branch" ]]; then
      label_str=":aws-lambda: Trigger deploy - ${component} ${version} to ${realm}.${environment} ${region}"
      command_str="${local_deploy_cmd} -t terraform -V \"${version}\""
    else
      label_str=":aws-lambda: Trigger deploy - ${component} to ${realm}.${environment} ${region}"
      command_str="${local_deploy_cmd} -t terraform"
    fi

    echo
    echo "Generating $label_str"

    $command_str >> steps.yaml.$$

  fi
}
