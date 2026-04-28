#!/bin/bash

set -e

module_path=$(pwd)
module_name=$(basename $module_path)
module_type=$(basename $(dirname $module_path))

echo "$(date '+%H:%M:%S') Running local $(basename $0) in ${module_name} pwd=$module_path..."
echo

component_name=$(jq --raw-output .name ./package.json)

artifact_name="${component_name}-$(date "+%Y%m%d_%H%M%S")"

if [ ! -z $BUILDKITE ] ; then

  if [ -z $BUILDKITE_TAG ] ; then
    artifact_name="${component_name}-build-${BUILDKITE_BUILD_NUMBER}"
  else
    if [[ "$BUILDKITE_TAG" =~ ^$module_name.v[0-9]+\.[0-9]+\.[0-9]+$ ]] ; then
      artifact_name="${component_name}-$(echo $BUILDKITE_TAG | sed -e "s#^${component_name}\.v##")"
    else
      artifact_name="${component_name}-${BUILDKITE_TAG#v}"
    fi
  fi
fi

echo
echo "Creating ${artifact_name}.zip..."

root_dir=/app

# make running this script on host easier
if [ ! -d $root_dir ]; then
  root_dir=$(git rev-parse --show-toplevel)
fi

cd $root_dir

npm run clean --workspaces --if-present >/dev/null

cd $module_path

npm run compile

if [ ! -d ./dist ] ; then
  echo "Error: missing dist dir"
  exit 1
fi

artifacts_dir=$module_path/build

rm -rf $artifacts_dir

build_dir=$artifacts_dir/staging

app_dir=$build_dir/$module_type/$module_name

mkdir -p $app_dir

# copy the app files
cp -r $module_path/dist/* $app_dir
cp $module_path/package.json $app_dir

cd $root_dir

# copy the dep pkg files
ls -1d libs/* | while read d
do
  if [ -d $d/dist ]; then
    pushd $d
    # Run a script that will copy asset files because # the dist folder of shared
    #  depenencies was created by tsc build references which does not copy asset files
    npm run compile
    popd
    mkdir -p $build_dir/$d
    cp -r $d/dist $build_dir/$d
    cp $d/package.json $build_dir/$d
  fi
done

# copy the workspace pkg json files
cp $root_dir/package.json $root_dir/package-lock.json $build_dir

cd $build_dir

npm ci --no-audit --omit=dev --include-workspace-root -w ./$module_type/$module_name

ln -s ./$module_type/$module_name/main.js .

zip -r --symlinks -q ${artifact_name}.zip .

if [ ! -f $module_path/Dockerfile -a ! -z "$BUILDKITE_BRANCH" -a -z "$BUILDKITE_TAG" ] ; then

  BRANCH_TAG="${BUILDKITE_BRANCH//\//_}"

  echo
  echo "Creating ${component_name}-${BRANCH_TAG}.zip..."

  cp ${artifact_name}.zip $artifacts_dir/${component_name}-${BRANCH_TAG}.zip
fi

mv ${artifact_name}.zip $artifacts_dir

echo "$(date '+%H:%M:%S') $(basename $0) complete"
