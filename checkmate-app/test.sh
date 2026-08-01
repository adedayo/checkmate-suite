#!/usr/bin/env bash
set -e

echo "=== Running Go Backend Tests ==="
go test -v .

echo ""
echo "=== Running Angular Frontend Tests ==="
cd frontend && npm run test -- --watch=false
