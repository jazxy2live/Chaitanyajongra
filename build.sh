#!/bin/bash

set -e

echo "Building website..."

required_files=("index.html" "css/style.css" "robots.txt" "scripts/build-essays.mjs")
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing required file: $file"
    exit 1
  fi
done

echo "Building writings..."
node scripts/build-essays.mjs

if command -v htmlhint &> /dev/null; then
  echo "Validating HTML..."
  htmlhint *.html essays/*.html
fi

if [ -d "images" ]; then
  echo "Checking image sizes..."
  find images \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) | while read img; do
    size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    if [ "$size" -gt 500000 ]; then
      echo "Large image: $img ($(($size/1024))KB)"
    fi
  done
fi

echo "Build complete."
