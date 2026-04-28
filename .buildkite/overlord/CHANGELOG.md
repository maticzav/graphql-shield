# v17.5.4

* shared/project/publish.sh - allow tags such as `sui-icons.v19.0.0-vue3`

# v17.5.3

* cypress - always generates logs, even if tests pass.
* npm caching - fix workspaces root cache to support merging multiple module caches.

# v17.5.2

* npm caching - improve cache restore for npm workspaces repos.
  * Cache workspaces repos at root & module level to avoid cache misses for module specific dependencies.
  * Restore `libs/*` & `packages/*` node_modules if there are missing dependencies after restoring module level cache.
  * Fallback to  `npm ci --no-audit --include-workspace-root` if there are still missing dependencies to ensure all workspace dependencies are installed.

# v17.5.1

* shared/buildkite/create-git-diff.sh - support module specific tags, e.g. arch-lambda's sqs-to-api.v6.0.0

# v17.5.0

* shared/project/package-workspace-app.sh - supports component prefixed tags, see arch-lambda tags for example
* update pkg deps

# v17.4.0

* shared/project/publish-internal.sh
  * provide a way to publish package from the module instead of inside `dist` folder
  * also `compile` script is not mandatory anymore if your lib/package does not need compilation
* MIGRATION GUIDE
  * add `PUBLISH_FROM_MODULE=1 ` to the start of your `smpublish` script. e.g. `PUBLISH_FROM_MODULE=1 ../../node_modules/@siteminder/overlord/shared/project/publish.sh`. p.s. path to overlord might differ if you are in a npm workspaces repo.
  * add the following to your the package.json of your lib/package. p.s. this assumes `index.js` is your code's entrypoint, change if yours is something else. Same goes for the `dist` folder.
```
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist/",
    "CHANGELOG.md",
    "README.md"
  ],
```

# v17.3.1

* shared/buildkite/migrations.sh: Skip when `BUILDKITE_TAG` is for a package, e.g. `BUILDKITE_TAG=domain-model.v1.2.3`
* shared/buildkite/deployments.sh: Skip deploy of migrations when `BUILDKITE_TAG` is for a package, e.g. `BUILDKITE_TAG=domain-model.v1.2.3`

# v17.3.0

* add shared/project/compile-test-lib.sh to compile lib in app when used in app tests **_only_**

  * Verifies that lib depdendencies are in production/development
  depdencies in the app

  * Apart from the above exception, exit conditions are the same as [shared/project/compile-lib.sh](#1640)

# v17.2.2

* playpen: Fix image pull for multi-arch when no profile is specified.

# v17.2.1

* shared/buildkite/deployments.sh: Fix dynamic deploy version check with lambdas.
  * Support `app_version` as well as `lamba_code_key` in the config file.

# v17.2.0

* improve deployment step's label - no need to see system since you would be looking at builds in the system's own pipeline.

# v17.1.4

* shared/ci-scripts: Remove `set -x` which inconjunction with subshells is messing with buildkite output.

# v17.1.3

* shared/buildkite/deployments.sh: Printout when deployment is skipped due to missing config.

# v17.1.2

* shared/project/compile-lib.sh: Specify `--tsBuildInfoFile .$MODULE.tsbuildinfo` in lib to avoid issues when compiling from component.

# v17.1.1

* base image update

# 17.1.0

* shared/project/copy_assets.sh - extracted out of compile-component.sh, left the similar logic in compile-lib.sh as it is not the same and is not reused.
* shared/project/package-workspace-app.sh - share how to build npm workspace apps
* shared/ci-scripts/* - make it possible for overlord to be installed at a diff location
* npm caching - cater for caching on repos with npm workspaces
* npm - change all npm install to use `--include-workspace-root`, backward compatible with non-workspace repos
* tsc - change compilation to use `--build` instead of `--project` so references are also compiled, backward compatible with config file without references
* tsc - remove assumption on where the command lives

# v17.0.2

* Fix playpen stop command to work with locally built images

# v17.0.1

* base image update

# 17.0.0

* shared/buildkite/create-git-diff.sh: Detect tag for package & generate a build for that package only.
* shared/project/publish.sh: Dynamically push beta tag if not a tag.
  * **BREAKING** Only tagged builds will publish a production package. See [README](./README.md).
  * Existing functionality moved to shared/project/publish-internal.sh.
  * MIGRATION GUIDE: add `MODULE=$MODULE` to the environment list in to your lib's docker-compose.yaml
* Remove unused shared/buildkite/terraform_deployments.sh

# 16.5.0

* use group steps for most of the shared/buildkite/* steps
* shared/buildkite/deployments.sh - flatten the deploy chain by skipping 1 intermediate build command step and go straight for the trigger step

# 16.4.3

* shared/buildkite/deployments.sh: Fix dynamic match of helm components.

# 16.4.2

* shared/buildkite/cypress.sh: Dynamically generated `cypress` steps run on the same agent queue as the parent agent
* Shutdown docker compose after tests

# 16.4.1

* shared/buildkite/deployments.sh: Restrict glob file match to avoid matching similarly named components.

# 16.4.0

* shared/project/compile-lib.sh: Verify lib's dependencies are installed in the app.
  * Script will fail with an error similar to `ERROR: Missing 2 packages in app dependencies`
  * Exit with `2` as error is non-recoverable.
* shared/project/compile-component.sh: Exit with `2` for non-recoverable tsc errors.

# 16.3.0

* change audit so that failure does not block build by adding soft fail condition for exit `3`.
* shared/ci-scripts/check-for-outdated-images.sh: exit with `3`. To add soft failure, use the following syntax:
  ```yaml
  - label: 'check for outdated images'
    command: './node_modules/\@siteminder/overlord/shared/ci-scripts/check-for-outdated-images.sh'
    soft_fail:
      - exit_status: 3
  ```
* shared/project/compile-component.sh: Remove redundant shared/project/bootstrap.sh invocation.

# 16.2.1

* shared/project/bootstrap.sh: Skip npm ci if nothing to install.

# 16.2.0
* Reduce automatic retries:
  * Only retry for exit codes `-1` & `1`.
  * Limit of 1 automatic retry.
  * `npm ci` failure exits with `2` to prevent retry for non-recoverable case.
  * docker compose failures for playpen and cypress harnesses exit with `2` to prevent retry for non-recoverable case.
* Reduce agent timeout to 30 minutes for tests.
* Add artifact export for test container logs & artifacts:
  ```yaml
  artifact_paths:
    - "${module_type}/${module}/test/logs/*.log"
    - "${module_type}/${module}/test/logs/*.tar.gz"
  ```

# 16.1.2
* Changed `check-for-outdated-images` to only consider images having tags

# 16.1.1
* Change `basename` command for compatibility with busybox (alpine)

# 16.1.0
* shared/buildkite/npm-cache.sh:
  * Add caching of `node_modules` dir in Buildkite.
  * Allows subsequent scripts to bypass `npm ci` & download cached node_modules dir.
  * Cache key is derived as `{{system}}-{{component}}-npm-{{arch}}-{{sha256(package.json)}}-{{sha256(package-lock.json)}}`
  * Add to top of `pipeline.yaml`, after `create-git-diff` step, but before `package`, `lint`, `test` steps etc
  ```yaml
  - wait

  - label: 'define npm cache steps'
    command: './node_modules/\@siteminder/overlord/shared/buildkite/npm-cache.sh'

  - wait
  ```

# 16.0.0
* Replace usage of `docker-compose` (v1) with `docker compose` (v2)
  * See https://docs.docker.com/compose/migrate/
  * Highlights from docs:
    * In Compose V1, an underscore (_) was used as the word separator. In Compose V2, a hyphen (-) is used as the word separator.
* `cypress` tests now expect a docker compose profile of `${frontend}-cypress` where previously it was `${frontend}`.
  * This removes the undesirable side effect of spinning up unnecessary containers for regular tests
* playpen: Fix parsing of siteminder docker images in compose files to allow inline comments

# 15.0.0
* Support Node v18.14.0 onwards.
* Support Npm v9.5.0 onwards.
* Replace `publish` command with `smpublish`.
  * This is necessary as `publish` is a restricted keyword

# 14.4.2
* shared/project/compile-component.sh: Detect if local libs shadow node_modules.

# 14.4.1
* Further remove instances of `npm bin` as its removed in npm 9.0.0

# 14.4.0
* No longer relying on `npm bin` as its removed in npm 9.0.0

# 14.3.2
* shared/buildkite/deployments.sh: Fix false positives in region detection.

# 14.3.1
* shared/ci-scripts/*.sh: pass BUILDKITE env all containers run on docker compose as npm behaves differently when running in ci (npm i/ci is a lot faster)

# 14.3.0
* shared/buildkite/test.sh: Dynamically generated `test` steps run on the same agent queue as the parent agent
* shared/ci-scripts:
  * Remove redundant `npm ci` at project root as `/app/node_modules` already exists.
  * Tweak cypress.sh output for docker-compose timing.
  * Add timestamps in all log headers for easier timing.
* shared/project:
  * Add timestamps for easier timing of scripts.

# 14.2.3
* shared/buildkite/deployments.sh: Restore support for regioned frontend deployments.

# 14.2.2
* shared/buildkite/deployments.sh: Hide `aws s3 ls` output when checking zip vs jar during lambda deployments

# 14.2.1
* shared/buildkite/deployments.sh: Fix parsing of `image.tag` for helm deployments

# 14.2.0

- added Jest parallelism support in `buildkite/test.sh` and `ci-scripts/test.sh`
  - Please check the POC findings in https://siteminder.atlassian.net/wiki/spaces/DevXp/pages/2601418753/Use+Buildkite+parallelism+and+jest+sharding+to+speed+up+builds

# 14.1.1

* Add support for cypress version 10 and above

# 14.1.0

* Pass BUILDKITE_ANALYTICS_TOKEN to enable BuildKite Test Analytics to the test steps

# 14.0.0

* shared/buildkite/deployments.sh:
  * Make `-e` an optional argument.
  * Remove unused `--use-tf-helm` and `--docker-version` args.
  * Add `--deploy-version branch-dynamic` option
  * Tidy up console output

# 13.1.3

* Replace `npm --silent run` with `npm run` to not unintentionally hide all output.

# 13.1.2

* Improve overlord command output readability
  * shared/buildkite:
    * Format output of `create-git-diff.sh`.
    * Ignore changes to `.buildkite/pipeline` files when creating git diff.
  * shared/ci-scripts:
    * Format output of `build.sh`, `build-migrations.sh`, `s3-upload.sh`, `audit.sh`, `cypress.sh`, `cypress-exec.sh`, `lint.sh`, `package.sh`, `publish.sh`, `test.sh` & `cat-npm-logs.sh`
    * Replace `npm run` with `npm --silent run`
  * shared/project:
    * Format output of `bootstrap.sh`, `compile-component.sh`, `compile-lib.sh`, `install-lib-dependencies.sh`, `package.sh`, `package-frontend.sh` & `publish.sh`
    * Replace `npm run` with `npm --silent run`
  * shared/playpen:
    * Format output of `module-compose.sh`
    * Replace `npm run` with `npm --silent run`

# 13.1.1

* Fix infras-compose.sh to skip docker pull for images not specified for profile.
* Reduce sleeps in test ci-scripts
* Tidy up playpen console output

# 13.1.0

* add bash/zsh tab completion command from yarg
* dynamically determine services option for `playpen start`

# 13.0.2

* Reduce the number of clicks needed to skip a failed audit.

# 13.0.1

* Update dependencies to address audits

# 13.0.0

**BREAKING!BREAKING!BREAKING!**

- realm pciprod/preprod now uses master branch for config and infrastructure
- drop support for "prod" realm

## Migration guide

Because now preprod must use master, you need to change your deployment setting

### If you are already using master for preprod

- in your app repo, install the latest overlord `npm i -S @siteminder/overlord@latest`
- in your app repo `.buildkite/pipeline.yml`, remove `--config-branch master --app-infras-branch master` , e.g. fix ci script like these https://github.com/siteminder-au/cm/blob/594c4a76bfc8e3dafa2b8fdb7ff4d8d471f29e0f/.buildkite/pipeline.yml#L67
- for your config-prerod repo, don't forget to set `master` branch as the default branch and delete `develop` if applicable

### If you are not using master for preprod, e.g. using `develop`

- in your app repo, install the latest overlord `npm i -S @siteminder/overlord@latest`
- in your app repo `.buildkite/pipeline.yml`, remove any branch overrides `--config-branch *override* --app-infras-branch *override*`
- for your config-preprod repo, bring the content from `develop` to `master`, e.g. use a PR or branch rename https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/renaming-a-branch
- for your config-preprod repo, don't forget to set `master` branch as the default branch and delete `develop` if applicable

# 12.0.0

* coverall is no longer used hence all supporting script are deleted.
  * By this stage (according to all PEs) all systems stopped using coveralls already so I will be brief in the upgrade nodes (if you can even call this that)... but tl;dr; remove all usage of all the scripts that got removed in this release which will most likely be found in system's `pipeline.yaml` & `package.json` scripts & npm pkg dependency.

# 11.2.1

* fix bug in project/package-frontend.sh, zip file by branch name is not created

# 11.2.0

* buildkite/deployments.sh: skip deployment step of components (docker & lambda) and frontends without config file unless `skip_config_check_arg` option is set

# 11.1.1

* need to disable `set -e` in `test-component` jobs at the end before gathering service logs

# 11.1.0

* gather all compose services' log in `test-component` jobs

# 11.0.0

* buildkite/deployments.sh: Add `--deploy-version` & remove `--docker-version`
  * Default option is `build` if missing which preserves behaviour if `--deploy-version` is ommitted.
  * Allowable values are:
    * `build`: Deploy using the artefact stamped with build number.
    * `branch`: Deploy with the artefact stamped with branch name.
    * `none`: Omit version arg.
* **BREAKING** Lambdas & frontends are no longer built with git sha, but build number instead e.g.
  * old: `<system>-<component>/<component>-77b55c2.zip`
  * new: `<system>-<component>/<component>-build-1234.zip`
* **BREAKING** fixed an issue with migration branch tag name that affects systems with more than 1 types (e.g. mysql, cassandra etc) of migrations, the issue would have used the same tag for both types of migrations as opposed to prefix the branch name with the migration type i.e. `mysql-migrations-<branch-name>`

# 10.6.0

* update `project/packages.sh` to create zip file by branch name on top of sha name for non-docker apps

# 10.5.0

* use npm ci so that if ever you mis-manage package.json & package-lock.json then the package installation aborts
  * e.g. if you modified & checked in package.json but didn't check in the corresponding package-lock.json
  * this also makes package-lock.json mandatory... script will abort if package-lock.json is not found

# 10.4.1

* update pkg deps

# 10.4.0

* `shared/ci-scripts/publish.sh`: Supply `BUILDKITE_BUILD_NUMBER` env var for custom publish script to use

# 10.3.1

* only creates a frontend zip by branch name when build is not a tagged build

# 10.3.0

* allow buildkite/deploy.sh to take system as argument

# 10.2.2

* fix bug in s3-upload.sh - copy it 1 file at a time

# 10.2.1

* fix bug in s3-upload.sh when there are multiple artifact files to be uploaded

# 10.2.0

* create a branch named frontend zip file in frontend packaging just like how docker images also gets branch name tag

# 10.1.3

* set pipefail so that git diff failure results in full build

# 10.1.2

* another bug on the new `--fast` switch in the ci-scripts portion which directly uses start.sh

# 10.1.1

* bug fix on `playpen start` around the new `--fast` switch

# 10.1.0

* `playpen start` gained a `--fast` switch that bypasses explicit docker pull
* incl `docker stats` in cypress ci-scripts and log file

# 10.0.0

* **BREAKING** removed support of `PLAYPEN_NAME`, `playpen.rc` & `dotenv.sh` i.e. playpen stack
* no need to start playpen services in `check-generated-types.sh`
* introduce `playpen start -p xxx` where `xxx` is the docker-compose profile. see https://docs.docker.com/compose/profiles/
  * in `cypress.sh`, `test.sh` & `test-component.sh` a profile that matches the folder name will be used to start playpen so that you can control exactly what services are started up for your component/lib/frontend.

# 9.1.1

* increase wait duration in cypress suite when waiting for components compilation/startup

# 9.1.0

* retry cypress step once if the step failed

# 9.0.1

* fix indentation in cypress buildkite step yaml

# 9.0.0

* Deleted seed files (`monorepo/` folder) and the `overlord` & `ov` command that uses the seed files
  * seeding systems and components are handled by stemcell and stemcell-infrastructure now

# 8.25.1

* buildkite/deployments.sh change `--use-tf-helm` default value to `yes`

# 8.25.0

* add timeout to all generated steps

# 8.24.2

* check frontend using the webpack port instead of proxy port

# 8.24.1

* in cypress suite increase wait for the frontend server

# 8.24.0

* audit step failure will result in a new blocked step been generated allowing the user to proceed anyways

# 8.23.0

* include screenshots from cypress suites in artifact_paths

# 8.22.1

* update yargs

# 8.22.0

* shared/buildkite/deployments.sh: Replace `--no-version-docker` with `--docker-version`
  * Default option is `build` if missing which preserves behaviour if `--no-version-docker` is ommitted.
  * Allowable values are:
    * `build`: Deploy using the artefact stamped with build number.
    * `branch`: Deploy with the artefact stamped with branch name.
    * `none`: Omit version arg.

# 8.21.7

* updated seed files

# 8.21.6

* updated seed files

# 8.21.5

* more cypress logging enhancements

# 8.21.4

* restore giving feedback that cypress failed due to container taking too long to come up

# 8.21.3

* single way of getting all container log when "anything" goes wrong in cypress step

# 8.21.2

* include stopped containers' log too

# 8.21.1

* explicitly set coveralls var because coveralls npm pkg has bugs

# 8.21.0

* support trigger build to run cypress steps

# 8.20.11

* fix typo

# 8.20.10

* prevent infinite look in case it never finds the `.git` dir

# 8.20.9

* forgot `git` command is not available inside container, use a loop to get to the root dir in `coveralls-upload.results.sh`

# 8.20.8

* coveralls lcov.info upload has to be done in the root of the repo otherwise the source file path cannot be calculated

# 8.20.7

* fix merging coveralls results

# 8.20.6

* no changes

# 8.20.5

* delete git-diff.txt that may have linger around on the agent's file system

# 8.20.4

* relay a couple of more buildkite env vars into the test containers

# 8.20.3

* let coveralls npm package setup coveralls config using buildkite env vars

# 8.20.2

* skip yaml comments when finding images that needs to be pulled

# 8.20.1

* less verbose cypress step stdout

# 8.20.0

* make check-generated-types.sh hook into playpen start as well

# 8.19.2

* fix getting service name to get logs

# 8.19.1

* need to not exit to get to collect log

# 8.19.0

* gather all composed service log when cypress step fails

# 8.18.0

* add test/end-to-end/logs/\*.log to buildkite artifacts for cypress steps

# 8.17.6

* fix infras-compose.sh to skip docker pull image where tag contains env variable as the pulling must have been handled by custom `npm run playpen:start`, e.g. cm-core-api

# 8.17.5

* revert port fix, original port was correct, it was meant to be host port
  * remove the beef healthcheck inside container since it is redundant

# 8.17.4

* bug fix on deriving beef port during cypress

# 8.17.3

* improve `ov init` & seed file update

# 8.17.2

* simplify beta publishing process by checking the version in package.json

# 8.17.1

* fix syntax error in `ci-scripts/cypress-exec.sh`

# 8.17.0

* added waiting for frontend server in `ci-scripts/cypress.sh` before start of cypress suite

# 8.16.1

* used `docker pull` on specific images instead of `docker-compose pull` to avoid hitting dockerhub

# 8.16.0

* only docker pull during playpen start if the compose yaml contains our own ecr images that is not a semver tag

# 8.15.2

* moved `ci-scripts/coveralls-upload-results.sh` to `project/coveralls-upload-results.sh` as `coveralls-upload-results.sh` are used inside container

# 8.15.1

* added `coverage` dir to be deleted in `project/clean.sh` to avoid uploading stale lcov.info files

# 8.15.0

* set the following coveralls env variables values in `ci-scripts/test.sh` so that no coveralls env vars needs to be set in docker-compose.yaml
  * COVERALLS_SERVICE_NAME=buildkite
  * COVERALLS_PARALLEL=true
  * COVERALLS_GIT_BRANCH="$BUILDKITE_BRANCH"
  * COVERALLS_SERVICE_JOB_ID=$BUILDKITE_BUILD_NUMBER
* created `ci-scripts/coveralls-upload-results.sh` script that uploads lcov.info to coveralls
* renamed `ci-scripts/merge-coveralls-results.sh` to `ci-scripts/coveralls-merge-results.sh` so the coveralls related scripts sits next to each other

# 8.14.2

* added `ci-scripts/merge-coveralls-results.sh` based on https://docs.coveralls.io/parallel-build-webhook

# 8.14.1

* always unset `COVERALLS_REPO_TOKEN` to prevent any possibilities of cross repo updates

# 8.14.0

* `ci-scripts/test.sh` will now automatically sets up repo in coveralls and pass the repo token to the container via `COVERALLS_REPO_TOKEN` env variable

# 8.13.0

* The npm publishing script i.e. `project/publish.sh` now supports `-t <tag>`. See `npm publish --help` to read about npm tags. This feature makes it possible to publish beta versions without affecting latest tag.

# 8.12.0

* New feature: if `npm run generated-types` exists then it will be called and build will fail if the component has dirty git repo due to files getting changed.

# 8.11.1

* Fix bk audit.sh

# 8.11.0

* npm-audit.sh is going to transition to be audit.sh, for now the buildkite layer npm-audit.sh will stick around but it will call the new buildkite layer audit.sh. ci-script layer npm-audit.sh is renamed to audit.sh
* ci-script/audit.sh is tweaked to support audit command detection to handle the scenario where package.json is inside base image instead of file system on host.

# 8.10.2

* ci-scripts cypress script will only retry 40 times to wait for all containers to be healthy, any unhealthy one will have its container logs relayed to output

# 8.10.1

* fix npm audit

# 8.10.0

* ci-scripts test-components and cypress ochestration scripts will now pull latest docker images
* ci-scripts cypress script will wait for every container to be healthy

# 8.9.0

* npm-audit.sh drops support for -t lenient|strict, it will do a vanilla `npm audit`, if that does not work for you then define an `"audit": <your-command>` npm run script in your package.json

# 8.8.0

* bk test step will auto retry 2 more times

# 8.7.0

* allow custom audit script to be called

# 8.6.0

* unify deployment include pattern's logic for frontends and migrations
* support no-version-docker in migration deployments too

# 8.5.0

* migration images are tagged by branch too just like component images

# 8.4.3

* increase max wait attempts waiting for beef to come up from 20 to 40 as goldeneye/admin-beef is fairly consistently not able to finish initialization within 20 wait attempts even on c5 instances.

# 8.4.2

* deleted `npx @siteminder/overlord create <system>` - creating system should be done thru `dx` command
* doco
* update monorepo seed files

# 8.4.1

* module-compose.sh no longer does a docker-compose pull as it is hard to make it work with test-component.sh due to a variable image arg

# 8.4.0

* simplify buildkite/test-component.sh by removing support for --include & --exclude because it can be controlled by npm run test-component detection
* buildkite/deployments.sh --include now uses the same regex standard as --exclude, i.e. we have consistency

# 8.3.1

* Removed last ref to docker-compose.local.yaml in playpen seed

# 8.3.0

* change `playpen up <compose-file|module> [service]` to look for docker-compose.playpen-up.yaml instead of docker-compose.image.yaml
* cypress.sh does not look for docker-compose.local.yaml or docker-compose.runtime.yaml. They are not used at all in cypress context.
* phased out lookup of docker-compose.local.yaml completely, it is either merged into docker-compose.test-component.yaml or not used.
* module-compose.sh needed to handle empty string override modes argument now.

# 8.2.1

* officially drop the custom component npm bootstraping
* fix how test-component.sh look for "test-component" script
* ci-scripts/test-component.sh now use only docker-compose.test-component.yaml file instead of docker-compose.image.yaml and docker-compose.local.yaml
  * if test_service is not passed to it then the default "<component>-test-runner" is the name of the service that is expected to exist in docker-compose.test-component.yaml

# 8.2.0

* buildkite/test-component.sh will dynamically determin if ci-scripts/test-component.sh step should be generated based on existence of npm run test-component as well as existing filters.

# 8.1.0

* Add cypress video to artifacts to help troubleshoot cypress failures

# 8.0.8

* Change `playpen compose` to only pull when up'ing services in compose
* dotenv.sh will do nothing if a `.env` file already exists because that is a sign user is customizing something

# 8.0.7

* Change os detection to something that works in `sh` too

# 8.0.6

* Restore mocha based project/test.sh as it is used in platform project at the moment...

# 8.0.5

* Update project/dotenv.sh to do nothing unless on macos

# 8.0.4

* We have been officially on jest for a while now so project/test.sh (mocha based) is deleted.
* Added new project/dotenv.sh that can dynamically determine the value for `DOTENV`. It can be sourced before running jest tests.

# 8.0.3

* Always do docker-compose pull in the compose wrapper scripts because we now use image tags that moves

# 8.0.2

* Introduce PLAYPEN_NAME env var to dynamically determine the override compose file name

# 8.0.1

* Fix how playpen (docker-compose) wrapper scripts determines current branch when running builds on buildkite

# 8.0.0

* cypress test used to look for docker-compose.app.yaml, it now looks for docker-compose.cypress.yaml

# 7.16.1

* change the semantic of branch specific compose yaml file. as opposed to 7.16.0 which merges all compose yaml files. This version ignores docker-compose.yaml if a branch specifi compose yaml file exists. Technically this change is not backward compatible but as the feature is SO new (rolled out yesterday) I elected to bump patch instead of major while fine tuning the workflow mechanics.

# 7.16.0

* both docker-compose wrapper scripts will get hardwired logic to look for a new compose file named specific for a branch

# 7.15.0

* pass CYPRESS_SUITE_NAME to docker compose in cypress script

# 7.14.0

* deployment script supports `--no-version-docker`, if set it will generate deploy steps without app version, i.e. the version will have to come from config repo

# 7.13.0

* Every docker image will get tagged with the branch name as well as the build number image tag

# 7.12.0

* deployment script supports `--use-tf-helm`, it set it will detect whether the app is deployed via helm i.e. `*-app` or terraform

# 7.10.0

* Created a new script `install-lib-depencencies.sh` that adds the dependencies of libs that a component uses in the component's dependencies.

Recommended approach of adding the new script to you component's `scripts`.

Assume a component uses a lib called `nxs-api-client`, i.e. the compile section of the component would look like the following

```
    "compile": "npm run clean && npm run compile-nxs-api-client && npm run compile-component",
    "compile-component": "../../node_modules/@siteminder/overlord/shared/project/compile-component.sh -p tsconfig.build.json",
    "compile-nxs-api-client": "../../node_modules/@siteminder/overlord/shared/project/compile-lib.sh -p tsconfig.build.json nxs-api-client",
```

nb. the composition style of commands, which is the highly recommended.

Now to make it easier to get the dependencies of `nxs-api-client` lib, add the following commands.

```
    "install-nxs-api-client-deps": "../../node_modules/@siteminder/overlord/shared/project/install-lib-dependencies.sh nxs-api-client",
    "install-lib-deps": "npm run install-nxs-api-client-deps"
```

Voila! `npm run install-lib-deps` will get exact version of `nxs-api-client`'s dependencies into the component.

# 7.9.0

* If build is scheduled then it is a full build

# 7.8.3

* Fix bug

# 7.8.2

* Fix bug

# 7.8.0

* Dynamically determins if a docker image's deployment type is helm or terraform

# 7.7.4

* Fix lambda version again without subshell

# 7.7.3

* Fix how lambda version is determined

# 7.7.2

* Increase number of iterations to wait for beef in cypress.sh, defer check for beef health til later

# 7.7.1

* Fix bug about git diff file generation that resulted in full build everytime

# 7.7.0

* only check lambda artifact in bucket once
* any beef changes in git diff will result in frontend been in scope for a build too

# 7.6.6

* make ci-scripts/cypress.sh quieter
* for lambda's, check if the version is a zip or a jar

# 7.6.5

* try to wait for about 1 min

# 7.6.4

* Fix how to call module compose to get logs

# 7.6.3

* Forgot that ci-scripts runs on host...

# 7.6.2

* Exit straight away if beef healthcheck does not come up

# 7.6.1

* Get the container log if the beef is still not up

# 7.6.0

* Use healthcheck to wait for beef in ci-scripts/cypress.sh

# 7.5.1

* Make frontend deployments in deployments.sh match the zip file built by package-frontend.sh

# 7.5.0

* created package-frontend.sh

# 7.4.2

* fix path to scripts in cypress.sh

# 7.4.1

* fix typo for cypress.sh

# 7.4.0

* add cypress test tooling

# 7.3.7

* Update overlord

# 7.3.6

* buildkite-agent artifact download fails for wildcard download that does not find any file too so applying the same fix to ensure `set -e` does not stop process

# 7.3.4

* buildkite-agent artifact download is exiting 1 instead of 0 when file not found so we need to ensure it does not stop the process if it has `set -e` by always return 0

# 7.3.2

* Fix bug in ci-scripts/npm-audit.sh
* Fix typo in generated lint step name

# 7.3.1

* Fix bug on how buildkite/lint.sh is calling ci-scripts/lint.sh

# 7.3.0

* added `ci-scripts/lint.sh` to generate lint steps

# 7.2.0

* added --service-ports to `playpen run`

# 7.1.2

* Update `ci-scripts/s3-upload.sh` to upload \*.jar on top of \*.zip

# 7.1.1

* Fix `compile-lib.sh`'s copying of libs

# 7.1.0

* `playpen seed` is born - it will docker-compose run the `seed` service in a system's `playpen/seed/docker-compose.yaml` file.

# 7.0.1

* Fix create-ecr-repos.sh bug

# 7.0.0

* New step that triggers ecr repo creation if required.
* No more support for `<system-repo>/migrations` folders.

# 6.4.0

* Exit 0 in `infras-compose.sh` instead of exit 1 when compose file does not exist.

# 6.3.4

* Assume npm run compile task will do the necessary bootstrap to save compile-lib.sh doing it.

# 6.3.3

* Fix bootstrap.sh exiting due to `set -e` when `grep` does not find anything (which is an exit 1)

# 6.3.2

* More effective way of determining whether `npm install` needs to be run or not
