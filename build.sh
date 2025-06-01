#!/bin/bash

# Simple build script for Chaitanya's website
# Run this before deploying to production

echo "🚀 Building website..."

# Check if all required files exist
required_files=("index.html" "css/style.css" "sitemap.xml" "robots.txt")
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

# Validate HTML (if htmlhint is installed)
if command -v htmlhint &> /dev/null; then
  echo "📝 Validating HTML..."
  htmlhint *.html
fi

# Check image sizes (if they're too large)
if [ -d "images" ]; then
  echo "📸 Checking image sizes..."
  find images -name "*.jpg" -o -name "*.png" | while read img; do
    size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    if [ "$size" -gt 500000 ]; then # 500KB
      echo "⚠️  Large image: $img ($(($size/1024))KB)"
    fi
  done
fi

# Update sitemap timestamp
today=$(date +%Y-%m-%d)
sed -i.bak "s/<lastmod>.*<\/lastmod>/<lastmod>$today<\/lastmod>/g" sitemap.xml
rm sitemap.xml.bak 2>/dev/null || true

echo "✅ Build complete!"
echo ""
echo "📋 Pre-deployment checklist:"
echo "   • Replace favicon.ico with actual icon"
echo "   • Update domain URLs if deploying to different domain"
echo "   • Add analytics tracking code if desired"
echo "   • Test all links work correctly"
echo "   • Verify mobile responsiveness" 