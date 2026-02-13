#!/usr/bin/env bash

set -euo pipefail

pnpm changeset tag

branch_name="${RELEASE_BRANCH:-$(git symbolic-ref --short -q HEAD || true)}"
if [ -z "$branch_name" ] || [ "$branch_name" = "HEAD" ]; then
    branch_name=$(git rev-parse --abbrev-ref HEAD)
fi

if [ -z "$branch_name" ] || [ "$branch_name" = "HEAD" ]; then
    echo "Cannot determine release branch. Set RELEASE_BRANCH." >&2
    exit 1
fi

# pnpm publish requires HEAD attached to a branch when publish-branch is set.
if [ "$(git rev-parse --abbrev-ref HEAD)" = "HEAD" ]; then
    git checkout -B "$branch_name"
fi

npm_tag=''
if [ "$branch_name" = 'master' ]; then
    npm_tag='latest'
else
    if [[ $branch_name =~ ^v[0-9]+$ ]]; then
        npm_tag="latest-${branch_name}"
    else
        npm_tag=$branch_name
    fi
fi

pnpm publish --recursive --publish-branch "$branch_name" --tag "$npm_tag"
