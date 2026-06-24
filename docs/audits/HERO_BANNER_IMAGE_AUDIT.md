# Hero Banner & Image Assets Audit

**Date:** 2026-06-24  
**Purpose:** Memory optimization for production heap

## Configuration

| Asset | Count | Storage |
|-------|-------|---------|
| Hero banners | 187 | public/data/hero-banners.json |
| Hero videos | 44 unique | R2 Cloudflare CDN |
| Total images | 1,016 | public/images/ (120 MB) |

## Image Format Breakdown

| Format | Count | % | Notes |
|--------|-------|---|-------|
| WebP | 793 | 78% | ✅ Already optimized |
| JPG | 188 | 22% | 🔄 Can convert to WebP |
| PNG | 14 | 1% | Icons/logos |
| SVG | 19 | 2% | Icons/logos |

## Storage by Folder

| Folder | Files | Size | Priority |
|--------|-------|------|----------|
| pages/ | 723 | 94 MB | High |
| hvac-diagrams/ | 49 | 3.2 MB | Low |
| programs/ | 20 | 1.7 MB | Medium |
| heroes/ | 12 | 1.6 MB | Medium |
| healthcare/ | 12 | 1.5 MB | Medium |

## Largest Images (>400KB)

1. `getting-started-hero.webp` - 511 KB
2. `construction-trades.webp` - 497 KB
3. `pathways-page-*.webp` - 450-490 KB (multiple)

## Memory Optimization Status

| Setting | Value | Savings |
|---------|-------|---------|
| productionSourceMap | false | ~500MB heap |
| Hero videos | CDN | 0MB bundle |
| Image format | 78% WebP | ✅ |

## Recommendations

### High Priority
1. Convert 188 JPG → WebP (~30% size reduction = ~10MB saved)
2. Compress images >400KB to 80% quality WebP

### Medium Priority
3. Add lazy loading for below-fold images
4. Consider responsive images (srcset)

### Low Priority
5. Audit unused images in pages/ folder
6. Remove duplicate hero images (multiple versions)
