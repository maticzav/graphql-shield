#!/bin/bash

if [ $# -ne 1 ]; then
  echo "Usage: $(basename $0) <path-to-frontend-cypress-suite>"
  exit 1
fi

set -e

CYPRESS_SUITE_FILE=$1

SCRIPTDIR=$(cd $(dirname $0); pwd)

echo "--- $(date '+%H:%M:%S') :npm: ci"
$SCRIPTDIR/../project/bootstrap.sh

echo "--- $(date '+%H:%M:%S') :npm: clean & dev (background)"
npm run clean

npm run dev &

echo "--- $(date '+%H:%M:%S') :cypress: cypress install"
npx cypress install

frontend_url="http://localhost:${PORT:=8080}"

if [ -f cypress.json ] || [ -f cypress.config.ts ]; then

  max_count=40
  count=1

  while [[ $count -le $max_count ]] && ! $(curl --output /dev/null --fail --silent ${frontend_url})
  do
    echo "attempt #${count} of ${max_count} waiting for (frontend) ${frontend_url} to be up..."
    ((count+=1))
    sleep 6
  done

fi

echo "--- $(date '+%H:%M:%S') Checking ${frontend_url}"
curl --output /dev/null --fail ${frontend_url}

echo "+++ $(date '+%H:%M:%S') :cypress: cypress run"
npm run cypress -- --browser /usr/bin/google-chrome --spec ${CYPRESS_SUITE_FILE}
