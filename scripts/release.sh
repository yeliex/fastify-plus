#!/usr/bin/env bash

set -e

pnpm changeset tag

npm_tag='latest';
branch_name=$(git symbolic-ref --short -q HEAD);
if [ $branch_name != 'master' ]; then
    if [[ $branch_name =~ ^v[0-9]+$ ]]; then
        npm_tag="v-${branch_name:1}"
    fi

fi

pnpm publish --recursive --publish-branch $branch_name --tag $npm_tag
