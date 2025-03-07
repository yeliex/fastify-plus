#!/usr/bin/env bash

pnpm changeset tag

# 如果git分支是master 使用latest标签 否则使用分支名
npm_tag='latest';
# 获取分支名
branch_name=$(git symbolic-ref --short -q HEAD);
if [ $branch_name != 'master' ]; then
  npm_tag=$branch_name;
fi

pnpm publish --recursive --tag $npm_tag
