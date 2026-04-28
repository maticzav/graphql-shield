#!/bin/bash

set -eo pipefail

if [ -z "$BUILDKITE" ]; then
  buildkite-agent() {
    xargs echo
  }
fi

usage() {
  echo "$(basename $0) -r <dev|prod|pciprod> -e <some env> -c <some component> -t <terraform|helm|frontend> -i <infras branch> -b <config branch> [-V <version>] [-R <region>]"
  exit 1
}

DIR=$(dirname $0)

system=$(basename $(git rev-parse --show-toplevel))

skip_config_check_arg=false

while getopts "r:e:S:c:t:V:R:b:g:i:s" o; do
    case "${o}" in
        r)
            realm=${OPTARG}
            ;;
        e)
            sm_env=${OPTARG}
            ;;
        S)
            system_arg=${OPTARG}
            ;;
        c)
            component=${OPTARG}
            ;;
        t)
            component_type=${OPTARG}
            ;;
        V)
            version=${OPTARG}
            ;;
        R)
            region=${OPTARG}
            ;;
        i)
            app_infras_branch=${OPTARG}
            ;;
        b)
            config_branch=$OPTARG
            ;;
        s)
            skip_config_check_arg=true
            ;;
        *)
            usage
            ;;
    esac
done
shift $((OPTIND-1))

if [ "${sm_env}" == "prod" -o "$realm" == "preprod" ]; then
  app_infras_branch="master"
  config_branch="master"
else
  app_infras_branch="${app_infras_branch:-develop}"
  config_branch="${config_branch:-develop}"
fi

if [ "${sm_env}" == "prod" -o "$realm" == "preprod" ]; then
  deploy_pipeline_branch="master"
else
  deploy_pipeline_branch="develop"
fi

if [ -n "${system_arg}" ]; then
  system=$system_arg
fi

sed "s#__REALM__#$realm#g;
     s#__ENV__#$sm_env#g;
     s#__SYSTEM__#$system#g;
     s#__COMPONENT__#$component#g;
     s#__COMPONENT_TYPE__#$component_type#g;
     s#__REGION__#$region#g;
     s#__APP_INFRAS_BRANCH__#$app_infras_branch#g;
     s#__VERSION__#$version#g;
     s#__CONFIG_BRANCH__#$config_branch#g;
     s#__SKIP_CONFIG_CHECK__#$skip_config_check_arg#g;
     s#__DEPLOY_PIPELINE_BRANCH__#$deploy_pipeline_branch#g;" \
     "${DIR}/deploy.yaml"
