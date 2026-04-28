#!/bin/bash

set -e

chained_rc=$1

echo "--- $(date '+%H:%M:%S') :npm: npm logs"

ls /root/.npm/_logs/*.log | while read f;
do
  echo $f
  cat $f
done

exit $chained_rc
