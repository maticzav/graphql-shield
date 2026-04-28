#!/usr/bin/env bash

set -e

APP="$(basename $(pwd))"
echo "$(date '+%H:%M:%S') Running $(basename $0) in $APP..."
echo

THISSCRIPTDIR=$(dirname $0)

DIR=$(pwd)

tsconfig_file="tsconfig.json"

while getopts ":p:" opt; do
  case $opt in
    p)
      tsconfig_file=$OPTARG
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done
shift $((OPTIND-1))

MODULE=$1

rm -rf ${DIR}/libs/${MODULE} ${DIR}/libs/.${MODULE}.tsbuildinfo

app_dependencies=( $(npm ls --omit=dev --all --json | ${THISSCRIPTDIR}/modules/list-dependencies.js) )

cd ../../libs/${MODULE}

if [ ! -f $tsconfig_file ]; then
  echo -e "\033[1;31mERROR:\033[0m Missing tsconfig file=$(pwd)/${tsconfig_file}"
  exit 2
fi

find src/app -type f ! -name "*.ts" -a ! -name "*.spec.ts*" | while read f
do
  target=$(echo $f | sed -e "s#src/app#${DIR}/libs/${MODULE}#")
  mkdir -p $(dirname ${target})
  cp $f $target
done

# Install any missing dependencies for libs
${THISSCRIPTDIR}/bootstrap.sh

compile_task=$(node -e 'console.log(!!require("./package.json").scripts.compile)')

echo
echo "$(date '+%H:%M:%S') Checking $MODULE dependencies are installed in $APP"
echo

lib_dependencies=( $(npm ls --omit=dev --json | ${THISSCRIPTDIR}/modules/list-dependencies.js) )

missing_deps=( $(comm -23 <(printf "%s\n" ${lib_dependencies[@]} | sort) <(printf "%s\n" ${app_dependencies[@]} | sort)) )

if [[ ${#missing_deps[@]} != 0 ]]; then
  echo -e "\033[1;31mERROR:\033[0m Missing ${#missing_deps[@]} packages in $APP dependencies:"
  printf '\055 %s\n' "${missing_deps[@]}"

  echo
  echo "To fix, do one of the following:"
  echo "- Install missing dependencies in $APP."
  echo "- Remove unused dependencies from $MODULE."
  echo "- Remove $MODULE from $APP if unused."
  echo
  exit 2
fi

echo "$(date '+%H:%M:%S') All $MODULE dependencies are installed!"
echo

if [ "$compile_task" == "true" ]; then
  echo "libs/${MODULE}: Executing npm compile..."
  npm run compile

  if [ -d libs ]; then
    mkdir -p ${DIR}/libs
    for d in libs/*; do
      rm -rf ${DIR}/libs/$(basename $d)
      cp -r $d ${DIR}/libs/$(basename $d)
    done
  fi
fi

echo "libs/${MODULE}: tsc -p $tsconfig_file --declaration --tsBuildInfoFile ${DIR}/libs/.${MODULE}.tsbuildinfo --outDir ${DIR}/libs/${MODULE}..."
npx tsc -p $tsconfig_file --declaration --tsBuildInfoFile ${DIR}/libs/.${MODULE}.tsbuildinfo --outDir ${DIR}/libs/${MODULE}

cd -

echo "$(date '+%H:%M:%S') compile-lib.sh ${MODULE} complete"
