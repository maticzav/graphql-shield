#!/usr/bin/env bash

THISSCRIPTDIR=$(dirname $0)

PACKAGE_NAME=$(node --eval="process.stdout.write(require('./package.json').name)")
PACKAGE_VERSION=$(node --eval="process.stdout.write(require('./package.json').version)")

# Verify expected package name format
if [[ ! "$PACKAGE_NAME" =~ ^@siteminder/[A-Za-z0-9-]+$ ]] ; then
  echo -e "\033[1;31mERROR:\033[0m Package name must be scoped under siteminder org, e.g. @siteminder/my-lib not my-lib"
  exit 1
fi

if [ -z "$MODULE" ] ; then
  echo -e "\033[1;31mERROR:\033[0m MODULE env var needs to be provided"
  exit 1
fi

if [ -z "${BUILDKITE_TAG}" ] ; then

  SAFE_BRANCH=$(echo -n "${BUILDKITE_BRANCH}" | sed "s/[^[:alnum:]-]/-/g")

  APP_VERSION="${PACKAGE_VERSION%-*}-${SAFE_BRANCH}-beta.${BUILDKITE_BUILD_NUMBER}"
  npm version "$APP_VERSION" --git-tag-version=false

elif [[ "$BUILDKITE_TAG" =~ ^$MODULE.v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$ ]] ; then

  APP_VERSION=${BUILDKITE_TAG#$MODULE.v}

  if [ "$APP_VERSION" != "$PACKAGE_VERSION" ]; then
    echo "TAG '$APP_VERSION' does not match package.json version '$PACKAGE_VERSION'"
    exit 1
  fi

else

  echo "Tag $BUILDKITE_TAG is not for $PACKAGE_NAME. Nothing to publish. Exiting..."
  exit 0

fi

echo "+++ Publishing $PACKAGE_NAME@$APP_VERSION"

${THISSCRIPTDIR}/publish-internal.sh
