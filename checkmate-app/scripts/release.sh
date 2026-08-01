#!/usr/bin/env bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ Error: Version parameter is required."
  echo "Usage: ./scripts/release.sh v2.1.0"
  exit 1
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-.*)?$ ]]; then
  echo "❌ Error: Invalid version format '$VERSION'. Must match semver pattern like 'v2.1.0'."
  exit 1
fi

echo "🚀 Bumping checkmate-app version to $VERSION..."

# Get current script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$APP_DIR"

# Ensure git repository is clean
if [[ $(git status --porcelain) ]]; then
  echo "❌ Error: Your git repository is not clean."
  echo "Please commit or stash your changes before cutting a release to ensure build stability."
  exit 1
fi

# Ensure we are on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️ Warning: You are releasing from branch '$BRANCH' instead of 'main'."
  echo "Press Ctrl+C to cancel or press Enter to continue."
  read -r
fi

# 1. Update AppVersion in app.go
echo "  - Updating AppVersion in app.go..."
sed -i.bak "s/var AppVersion = \".*\"/var AppVersion = \"$VERSION\"/g" app.go
rm -f app.go.bak

# 2. Build & Test Verification
echo "  - Verifying Angular frontend build..."
(cd frontend && npm run build)

echo "  - Verifying Go backend compilation..."
go build -ldflags "-X main.AppVersion=$VERSION" -o /tmp/checkmate-app-test .
rm -f /tmp/checkmate-app-test

# 3. Git Commit & Tagging
echo "  - Committing version bump..."
git add app.go
git commit -m "build(release): bump version to $VERSION" || true

echo "  - Creating git tag $VERSION..."
git tag -a "$VERSION" -m "CheckMate-App Release $VERSION"

echo "  - Pushing commits and tag to GitHub..."
git push origin HEAD
git push origin "$VERSION"

echo "✅ Successfully tagged $VERSION and pushed to GitHub!"
echo "✨ GitHub Actions workflow is now building multi-platform release assets!"
