#!/bin/bash

set -e
PURPLE='\033[0;35m'
NC='\033[0m'

currentVersion=$(cat package.json | jq -r '.version')
nextVersion=$(cat package.json | jq -r '.nextVersion')
nextVersionIncrement=$(cat package.json | jq -r '.nextVersionIncrement')

if [ "$currentVersion" = "$nextVersion" ]; then
    echo "ERROR: package.json's version and nextVersion are the same."
    exit 1
fi

echo -e "\n${PURPLE}######## Confirm Tools Webapp ${currentVersion} -> ${nextVersion} (${nextVersionIncrement} change) Release ########${NC}\n"
echo -e "- Current version: ${currentVersion}"
echo -e "- Release version: ${PURPLE}${nextVersion}${NC}"
echo -e "- Increment: ${PURPLE}${nextVersionIncrement}${NC}"
echo -e "\n${PURPLE}The script updates the changelog; updates package.json and package-lock.json; creates a release commit and tags it.${NC}"

while true; do

read -e -p "Are you sure? (yes/no) " yn

case $yn in
    yes ) break;;
    no ) exit;;
esac

done

develop="develop"

develop_latest=$(git ls-remote origin $develop | awk '{ print $1 }')
local_develop_latest=$(git rev-parse $develop)
current_branch=$(git branch --show-current)

if [ "$develop_latest" != "$local_develop_latest" ]; then
    echo "ERROR: local $develop's latest commit $local_develop_latest differs from remote $develop's $develop_latest."
    exit 1
fi

if [ "$current_branch" != "$develop" ]; then
    echo "ERROR: you must release from $develop, you're currently on $current_branch"
    exit 1
fi

npx release-it --no-npm.publish --ci $nextVersionIncrement

develop_after_release_local=$(git rev-parse HEAD)

echo -e "\n${PURPLE}All is DONE.${NC}\n"
echo -e "- Create a merge request in Gitlab from develop to master."
echo -e "- Merge it."
