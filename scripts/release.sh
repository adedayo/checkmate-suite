#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh <tag> (e.g., ./scripts/release.sh v0.9.5)"
  exit 1
fi

NEW_VERSION=$1
GO_VERSION="1.26.1"
MODULES=("checkmate-core" "checkmate-plugin" "checkmate-badger-project-manager" "git-service-driver" "ldap-sync")
ALL_DIRS=("checkmate-core" "checkmate-plugin" "checkmate-badger-project-manager" "git-service-driver" "ldap-sync" "checkmate")

echo "🚀 Preparing release for $NEW_VERSION across all modules..."

for dir in "${ALL_DIRS[@]}"; do
  echo "----------------------------------------"
  echo "📦 Processing $dir"
  pushd "$dir" > /dev/null

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
      
      # Update replace directive if it exists
      if grep -q "replace github.com/adedayo/$mod " go.mod; then
         go mod edit -dropreplace "github.com/adedayo/$mod@$OLD_VERSION"
         # Sometimes it's written without the version on the left side
         go mod edit -dropreplace "github.com/adedayo/$mod" 2>/dev/null || true
         go mod edit -replace "github.com/adedayo/$mod@$NEW_VERSION=../$mod"
      fi
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
