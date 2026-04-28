#!/bin/bash

set -e

fast="no"

while getopts "p:s:f" opt; do
  case $opt in
    p)
      profile=$OPTARG
      ;;
    s)
      services=$OPTARG
      ;;
    f)
      fast="yes"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      ;;
  esac
done
shift $((OPTIND-1))

if [ -n "$profile" ]; then
  $(dirname $0)/infras-compose.sh -f ${fast} -p ${profile} -- up -d ${services}
else
  $(dirname $0)/infras-compose.sh -f ${fast} -- up -d ${services}
fi
