#!/usr/bin/env bash

set -e

echo "$(date '+%H:%M:%S') Running $(basename $0) in $(basename $(pwd))..."
echo

if [ $# -eq 0 ];then	
    ./node_modules/.bin/mocha 'test/**/*.spec.ts' 'src/**/*.spec.ts' --colors --exit
else 
	./node_modules/.bin/mocha $@ --colors --exit
fi

echo "$(date '+%H:%M:%S') test.sh complete"
