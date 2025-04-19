#!/bin/bash

echo "Clearing all caches..."

# Project-specific caches
echo "Clearing node_modules..."
rm -rf node_modules

echo "Clearing Git LFS cache..."
rm -rf .git/lfs/cache

# NPM caches
echo "Clearing NPM cache..."
npm cache clean --force

# Clear system caches
echo "Clearing system caches..."
rm -rf ~/.cache/flock-of-postcards 2>/dev/null

# Clear browser caches (instructions)
echo ""
echo "To complete cache clearing, please also:"
echo "1. Clear your browser cache:"
echo "   - Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)"
echo "   - Select 'Clear data' with 'Cached images and files' checked"
echo ""
echo "2. Restart your development server"
echo ""

echo "Cache clearing complete!" 