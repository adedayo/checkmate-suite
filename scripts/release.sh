#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh <tag> (e.g., ./scripts/release.sh v0.9.5)"
  exit 1
fi

NEW_VERSION=$1
GO_VERSION="1.26.1"
# Discover all submodules dynamically (extensible for future apps)
ALL_DIRS=()
while read -r dir; do
  ALL_DIRS+=("$dir")
done < <(git config --file .gitmodules --get-regexp path | awk '{ print $2 }')

# Library modules (submodules excluding the main app 'checkmate') to bump in go.mod
MODULES=()
for dir in "${ALL_DIRS[@]}"; do
  # We assume anything not named 'checkmate' or ending in '-app' is a library.
  # For now, we just exclude 'checkmate'. If you add 'checkmate-desktop', you can exclude it here.
  if [[ "$dir" != "checkmate" && "$dir" != *"-app" ]]; then
    MODULES+=("$dir")
  fi
done
echo "🚀 Preparing release for $NEW_VERSION across all modules..."

for dir in "${ALL_DIRS[@]}"; do
  echo "----------------------------------------"
  echo "📦 Processing $dir"
  pushd "$dir" > /dev/null

  # 0. Safety Checks: Ensure on main and synced
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$BRANCH" != "main" ]; then
    echo "❌ Error: $dir is on branch $BRANCH. Must be on main."
    exit 1
  fi
  
  git fetch origin main >/dev/null 2>&1
  BEHIND=$(git rev-list HEAD..origin/main --count)
  if [ "$BEHIND" -gt 0 ]; then
    echo "❌ Error: $dir is $BEHIND commits behind origin/main. Please pull first."
    exit 1
  fi

  # 1. Update Go version to the requested latest
  echo "   - Updating go.mod to go $GO_VERSION"
  go mod edit -go=$GO_VERSION

  # 2. Update dependencies
  for mod in "${MODULES[@]}"; do
    # Check if the module depends on $mod
    if grep -q "github.com/adedayo/$mod v" go.mod; then
      # Extract the old version so we can drop the old replace if necessary
      OLD_VERSION=$(grep -E "^	?github.com/adedayo/$mod v" go.mod | awk '{print $2}')
      
      echo "   - Bumping $mod from $OLD_VERSION to $NEW_VERSION"
      go mod edit -require "github.com/adedayo/$mod@$NEW_VERSION"
      
      # Always add a replace directive so go mod tidy can resolve the local directory before the tag exists remotely
      go mod edit -dropreplace "github.com/adedayo/$mod@$OLD_VERSION" 2>/dev/null || true
      go mod edit -dropreplace "github.com/adedayo/$mod" 2>/dev/null || true
      go mod edit -replace "github.com/adedayo/$mod@$NEW_VERSION=../$mod"
    fi
  done

  echo "   - Running go mod tidy"
  go mod tidy

  # 3. Commit and push the local submodule changes to main
  if [[ -n $(git status -s) ]]; then
    echo "   - Committing and pushing changes to $dir main branch"
    git add .
    git commit -m "chore: release $NEW_VERSION"
    git push origin main
  else
    echo "   - No changes to commit in $dir"
  fi

  popd > /dev/null
done

echo "----------------------------------------"
echo "✅ Submodules updated. Preparing meta-repository..."

# Add all submodules (which will capture their new commits)
git add .
if [[ -n $(git status -s) ]]; then
  git commit -m "chore: release $NEW_VERSION"
  git push origin main
fi

# Finally, tag the suite repository to trigger the GitOps pipeline
echo "🏷️ Tagging checkmate-suite with $NEW_VERSION..."
git tag "$NEW_VERSION"
git push origin "$NEW_VERSION"

echo "🎉 Release initiated! The GitHub Action will now orchestrate the build and publish."
