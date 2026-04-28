#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Usage: $(basename $0) <path-to-compose-file>"
  exit 1
fi

set -e

echo "*****************************************************************************************************"
echo "*** ERROR: \"publish\" script is no longer supported in package.json. Change to \"smpublish\". ***"
echo "*****************************************************************************************************"

exit 1
