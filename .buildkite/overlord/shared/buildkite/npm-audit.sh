#!/bin/bash

SCRIPTDIR=$(dirname $0)

echo "*********************************************************************************************"
echo "*** WARNING: ${SCRIPTDIR}/npm-audit.sh is deprectated.  Use ${SCRIPTDIR}/audit.sh instead ***"
echo "*********************************************************************************************"

${SCRIPTDIR}/audit.sh
