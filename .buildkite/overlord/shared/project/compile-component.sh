#!/usr/bin/env bash

echo "$(date '+%H:%M:%S') Running $(basename $0) in $(basename $(pwd))..."
echo

THISSCRIPTDIR=$(dirname $0)

set -e

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

if [ ! -f $tsconfig_file ]; then
  echo -e "\033[1;31mERROR:\033[0m Missing tsconfig file=${tsconfig_file}"
  exit 2
fi

${THISSCRIPTDIR}/copy_assets.sh

echo "tsc --build $tsconfig_file..."

if ! npx tsc --build $tsconfig_file ; then
  exit 2
fi

if [ -d "./libs" ]; then
  find libs -type d -mindepth 1 -maxdepth 1 | while read d ; do

    if [[ -d "node_modules/$(basename $d)" ]] ; then
      echo
      echo -e "\033[1;31mERROR:\033[0m $d shadows node_modules/$(basename $d). Exiting."
      echo
      exit 2
    fi

    echo "Copying lib $d to dist/node_modules/"
    mkdir -p dist/node_modules/$(basename $d)
    cp -r $d dist/node_modules/
  done
fi

echo "$(date '+%H:%M:%S') compile-component.sh complete"
