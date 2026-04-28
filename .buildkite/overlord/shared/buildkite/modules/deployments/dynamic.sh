#!/usr/bin/env bash

_load_configured_environments_for_component() {

  component="$1"

  if [ -d "${SYSTEM_CONFIG_REPO_PATH}" ]; then

    if [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}" ] && [ ! -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      find "${SYSTEM_CONFIG_REPO_PATH}/${component}" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;

    elif [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf" ] && [ ! -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      find "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;

    elif [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      find "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;

    fi

  fi

}

_component_has_configured_region_for_environment() {

  environment="$1"
  component="$2"

  if [ -d "${SYSTEM_CONFIG_REPO_PATH}" ]; then

    if [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}" ] && [ ! -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      while read potential_region ; do
        if find "$potential_region" -mindepth 1 -maxdepth 1 -type f -exec basename {} \; | grep -qE 'terraform.tfvars|frontend.rc' ; then
          return 0
        fi
      done < <(find "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}" -mindepth 1 -maxdepth 1 -type d)

      return 1

    elif [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf" ] && [ ! -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      while read potential_region ; do
        if find "$potential_region" -mindepth 1 -maxdepth 1 -type f -exec basename {} \; | grep -q 'terraform.tfvars' ; then
          return 0
        fi
      done < <(find "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf/${environment}" -mindepth 1 -maxdepth 1 -type d)

      return 1

    elif [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      while read potential_region ; do
        if find "$potential_region" -mindepth 1 -maxdepth 1 -type f -exec basename {} \; | grep -q 'helm.yaml' ; then
          return 0
        fi
      done < <(find "${SYSTEM_CONFIG_REPO_PATH}/${component}-app/${environment}" -mindepth 1 -maxdepth 1 -type d)

      return 1

    else

      return 1

    fi

  fi


}

_load_configured_regions_for_environment_component() {

  environment="$1"
  component="$2"

  if [ -d "${SYSTEM_CONFIG_REPO_PATH}" ]; then

    if [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}" ] && [ ! -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      find "${SYSTEM_CONFIG_REPO_PATH}/${component}/${environment}" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;

    elif [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf" ] && [ ! -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      find "${SYSTEM_CONFIG_REPO_PATH}/${component}-inf/${environment}" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;

    elif [ -d "${SYSTEM_CONFIG_REPO_PATH}/${component}-app" ]; then

      find "${SYSTEM_CONFIG_REPO_PATH}/${component}-app/${environment}" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;

    fi

  fi
}
