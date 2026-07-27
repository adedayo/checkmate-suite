#!/bin/bash
set -e

echo "🚀 Starting automated dependency updates for all modules..."

# Discover all submodules dynamically
ALL_DIRS=()
while read -r dir; do
  ALL_DIRS+=("$dir")
done < <(git config --file .gitmodules --get-regexp path | awk '{ print $2 }')

# Always include the root/main application if it's not in the submodule list
if [[ ! " ${ALL_DIRS[@]} " =~ " checkmate " ]]; then
  ALL_DIRS+=("checkmate")
fi

for dir in "${ALL_DIRS[@]}"; do
  echo "----------------------------------------"
  echo "📦 Updating $dir"
  pushd "$dir" > /dev/null

  # Check if we are on main
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$BRANCH" != "main" ]; then
    echo "⚠️ $dir is not on main branch. Skipping."
    popd > /dev/null
    continue
  fi

  # Pull latest
  git pull origin main --quiet

  echo "   - Running go get -u -t ./... to upgrade all direct and indirect dependencies"
  go get -u -t ./...

  echo "   - Running go mod tidy"
  go mod tidy

  echo "   - Verifying builds"
  if ! go build ./...; then
    echo "❌ Build failed in $dir after dependency update!"
    exit 1
  fi

  echo "   - Running tests"
  if ! go test ./...; then
    echo "❌ Tests failed in $dir after dependency update! Please review breaking changes."
    exit 1
  fi

  # Commit if there are changes
  if [[ -n $(git status -s) ]]; then
    echo "   - Committing and pushing dependency bumps..."
    git add go.mod go.sum
    git commit -m "build(deps): bump all dependencies to latest minor/patch versions"
    git push origin main
  else
    echo "   - Dependencies are already up to date."
  fi

  popd > /dev/null
done

echo "✅ All submodules successfully updated!"
