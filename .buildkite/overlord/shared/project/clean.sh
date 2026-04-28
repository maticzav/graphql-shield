#!/usr/bin/env bash

set -e

echo "$(date '+%H:%M:%S') Running $(basename $0) in $(basename $(pwd))..."
echo

rm -rf build dist libs .tsbuildinfo coverage

echo "$(date '+%H:%M:%S') clean.sh complete: build dist libs .tsbuildinfo coverage"
