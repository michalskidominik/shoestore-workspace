# Cache Busting for Mobile Development

This document explains the cache busting implementation for the Shoestore Angular applications when deployed on Vercel.

## Overview

The cache busting system automatically prevents aggressive caching during development and preview deployments while maintaining optimal performance for production builds.

## Environment Detection

The system detects the deployment environment using the following conditions:

### Development/Preview Mode
Cache busting is enabled when **any** of the following conditions are true:
- `VERCEL_ENV=preview` (Vercel preview deployments)
- `NODE_ENV=development` (local development)
- `VERCEL_GIT_COMMIT_REF` is not "master" (feature branch deployments)

### Production Mode
Cache busting is disabled when:
- `VERCEL_ENV=production` OR
- `NODE_ENV=production` OR
- No environment variables are set (default)

## Cache Busting Features

### Development/Preview Builds

1. **Build Configuration**
   - Uses Angular `development` configuration with `outputHashing=all`
   - Generates source maps for debugging
   - Optimizes for development experience

2. **HTML Meta Tags**
   ```html
   <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
   <meta http-equiv="Pragma" content="no-cache">
   <meta http-equiv="Expires" content="0">
   <meta name="cache-bust" content="[timestamp]">
   ```

3. **Asset URL Timestamps**
   - Adds `?v=[timestamp]` to all CSS and JS asset URLs
   - Ensures fresh downloads on every deployment

4. **HTTP Headers**
   - Creates `_headers.json` with cache-control directives
   - Sets `X-Cache-Bust` header with build timestamp

5. **Visual Indicators**
   - Shows "DEV MODE - Cache Disabled" badge on landing page
   - Includes build timestamp in footer
   - Adds timestamp query parameters to navigation links

### Production Builds

1. **Optimized Configuration**
   - Uses Angular `production` configuration
   - Enables all optimizations and minification
   - Removes debug information

2. **Standard Caching**
   - Relies on Angular's built-in `outputHashing`
   - No additional cache busting mechanisms
   - Optimized for performance and CDN caching

## Usage

### Manual Testing

```bash
# Test development build with cache busting
NODE_ENV=development npm run build:vercel

# Test preview build (simulates Vercel preview)
VERCEL_ENV=preview npm run build:vercel

# Test production build (no cache busting)
npm run build:vercel
```

### Vercel Deployment

The cache busting is automatically applied based on Vercel's environment variables:

- **Production** (master branch): Standard caching
- **Preview** (pull requests): Cache busting enabled
- **Development** (feature branches): Cache busting enabled

## File Structure

The cache busting implementation affects:

```
├── scripts/vercel-build.js     # Main build script with environment detection
├── vercel.json                 # Vercel configuration with cache headers
└── dist-vercel/               # Output directory
    ├── _headers.json          # Development headers (when applicable)
    ├── client-shop/
    │   └── index.html         # Cache-busted HTML
    ├── admin-panel/
    │   └── index.html         # Cache-busted HTML
    └── index.html             # Landing page with dev indicators
```

## Mobile Development Benefits

1. **Immediate Updates**: Changes are visible immediately without manual cache clearing
2. **Debugging**: Source maps and unminified code for easier debugging
3. **Visual Feedback**: Clear indicators when running in development mode
4. **No Manual Intervention**: Automatic detection of environment type

## Technical Implementation

### Environment Detection Logic

```javascript
const isDevelopment = process.env.VERCEL_ENV === 'preview' || 
                     process.env.NODE_ENV === 'development' || 
                     (process.env.VERCEL_GIT_COMMIT_REF && process.env.VERCEL_GIT_COMMIT_REF !== 'master');

const isProduction = !isDevelopment && (
  process.env.NODE_ENV === 'production' || 
  process.env.VERCEL_ENV === 'production' || 
  !process.env.NODE_ENV
);
```

### Asset URL Transformation

```javascript
html = html.replace(/(src|href)="([^"]*\.(js|css))"/g, (match, attr, url, ext) => {
  if (url.startsWith('http') || url.includes('?')) return match;
  return `${attr}="${url}?v=${timestamp}"`;
});
```

### Headers Configuration

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Pragma", "value": "no-cache" },
        { "key": "Expires", "value": "0" },
        { "key": "X-Cache-Bust", "value": "[timestamp]" }
      ]
    }
  ]
}
```

## Troubleshooting

### Still Seeing Cached Content?

1. Check browser dev tools to verify cache-bust parameters are present
2. Confirm environment variables are set correctly
3. Clear browser cache manually as a last resort
4. Check network tab for 304 vs 200 responses

### Performance Impact

- **Development**: Larger bundle sizes, no compression
- **Production**: Optimal performance, standard caching behavior
- **Network**: Additional query parameters add minimal overhead

## Maintenance

The cache busting system is designed to be maintenance-free:

- Automatically detects environment
- No manual configuration required
- Self-contained within the build process
- Does not affect production performance