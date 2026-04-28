#!/usr/bin/env bash

SCRIPT_DIR=$(dirname "$0")

pushd $SCRIPT_DIR >/dev/null

echo "Installing latest @siteminder/overlord v17.x"

rm -rf node_modules overlord package-lock.json

npm i @siteminder/overlord@17 --no-audit --no-save

ln -f -s ./node_modules/@siteminder/overlord .

popd >/dev/null
