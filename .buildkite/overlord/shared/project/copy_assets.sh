#!/usr/bin/env bash

mkdir -p src/app
find src/app -type f ! -name "*.ts" -a ! -name "*.spec.ts*" | while read f
do
  target=$(echo $f | sed -e's#src/app#dist#')
  mkdir -p $(dirname ${target})
  cp $f $target
done
