#!/usr/bin/env node
/**
 * Nx-aware Vercel build script for Angular SPA apps.
 * Builds multiple Angular apps and structures output for Vercel deployment.
 * Optimized for 2025 Vercel + Nx best practices.
 * 
 * Includes cache busting for development/preview deployments.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distVercel = path.join(root, 'dist-vercel');

// Detect environment for cache busting
const isDevelopment = process.env.VERCEL_ENV === 'preview' || 
                     process.env.NODE_ENV === 'development' || 
                     (process.env.VERCEL_GIT_COMMIT_REF && process.env.VERCEL_GIT_COMMIT_REF !== 'master');

// Default to production if no specific environment is set
const isProduction = !isDevelopment && (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || !process.env.NODE_ENV);

const buildConfig = isProduction ? 'production' : 'development';
const timestamp = Date.now();

console.log(`🌍 Environment: ${isProduction ? 'Production' : 'Development/Preview'}`);
console.log(`📦 Build Configuration: ${buildConfig}`);
if (!isProduction) {
  console.log(`🕒 Cache busting timestamp: ${timestamp}`);
}

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

function rimraf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Missing build output: ${src}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function addCacheBustingToHtml(htmlPath, appName) {
  if (isProduction) return;
  
  console.log(`🚫 Adding cache busting to ${appName} HTML...`);
  
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Add cache busting meta tags
  const cacheBustingMeta = `
  <!-- Cache busting for development -->
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="cache-bust" content="${timestamp}">
  <!-- End cache busting -->`;
  
  // Insert before closing head tag
  html = html.replace('</head>', `${cacheBustingMeta}\n</head>`);
  
  // Add timestamp to asset URLs for additional cache busting
  html = html.replace(/(src|href)="([^"]*\.(js|css))"/g, (match, attr, url, ext) => {
    if (url.startsWith('http') || url.includes('?')) return match;
    return `${attr}="${url}?v=${timestamp}"`;
  });
  
  fs.writeFileSync(htmlPath, html);
}

console.log('🔨 Building Nx workspace for Vercel deployment...');

// Clean problematic cache directories that interfere with Nx project graph
console.log('\n🧹 Cleaning cache directories...');
rimraf(path.join(root, '.angular'));
rimraf(path.join(root, '.nx/cache'));
rimraf(distVercel);

// Ensure output directory exists
fs.mkdirSync(distVercel, { recursive: true });

// Reset Nx project graph cache
console.log('\n🔄 Resetting Nx cache...');
try {
  run('npx nx reset');
} catch {
  console.log('⚠️ Nx reset failed, continuing...');
}

// Build both Angular apps with appropriate configuration and correct base href
console.log('\n📦 Building Angular applications...');

if (isProduction) {
  // Production builds (existing behavior)
  run('npx nx build client-shop --configuration=production --base-href=/client-shop/');
  run('npx nx build admin-panel --configuration=production --base-href=/admin-panel/');
} else {
  // Development builds with enhanced cache busting
  run(`npx nx build client-shop --configuration=development --base-href=/client-shop/ --output-hashing=all`);
  run(`npx nx build admin-panel --configuration=development --base-href=/admin-panel/ --output-hashing=all`);
}

// Copy build outputs to Vercel structure
const clientOut = path.join(root, 'dist', 'apps', 'client-shop', 'browser');
const adminOut = path.join(root, 'dist', 'apps', 'admin-panel', 'browser');

console.log('\n📁 Structuring output for Vercel...');
copyDir(clientOut, path.join(distVercel, 'client-shop'));
copyDir(adminOut, path.join(distVercel, 'admin-panel'));

// Apply cache busting to HTML files in development
if (!isProduction) {
  console.log('\n🚫 Applying cache busting for development...');
  addCacheBustingToHtml(path.join(distVercel, 'client-shop', 'index.html'), 'client-shop');
  addCacheBustingToHtml(path.join(distVercel, 'admin-panel', 'index.html'), 'admin-panel');
}

// Create root landing page
const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shoestore Applications</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    ${!isProduction ? `
    <!-- Cache busting for development -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <meta name="cache-bust" content="${timestamp}">
    <!-- End cache busting -->` : ''}
    <style>
        body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        main {
            max-width: 520px;
            width: 100%;
            padding: 40px;
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,.4);
            border: 1px solid rgba(255,255,255,.1);
        }
        h1 {
            margin-top: 0;
            font-size: 2.2rem;
            font-weight: 700;
            text-align: center;
            background: linear-gradient(135deg, #60a5fa, #34d399);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            text-align: center;
            opacity: 0.8;
            margin-bottom: 32px;
            font-size: 1.1rem;
        }
        ${!isProduction ? `
        .dev-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f59e0b;
            color: #000;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: bold;
            z-index: 1000;
        }` : ''}
        a.card {
            display: block;
            padding: 20px 24px;
            margin: 16px 0;
            background: linear-gradient(135deg, #334155, #475569);
            border-radius: 12px;
            color: #fff;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,.1);
        }
        a.card:hover {
            background: linear-gradient(135deg, #475569, #64748b);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(0,0,0,.3);
        }
        .card-emoji {
            font-size: 1.5rem;
            margin-right: 12px;
        }
        footer {
            margin-top: 32px;
            font-size: 0.85rem;
            opacity: 0.6;
            text-align: center;
        }
        @media (max-width: 600px) {
            main { padding: 24px; }
            h1 { font-size: 1.8rem; }
        }
    </style>
</head>
<body>
    ${!isProduction ? `<div class="dev-indicator">DEV MODE - Cache Disabled</div>` : ''}
    <main>
        <h1>Shoestore</h1>
        <p class="subtitle">Select an application to continue</p>
        <a class="card" href="/client-shop/${!isProduction ? `?v=${timestamp}` : ''}">
            <span class="card-emoji">🛍️</span>Client Shop
        </a>
        <a class="card" href="/admin-panel/${!isProduction ? `?v=${timestamp}` : ''}">
            <span class="card-emoji">⚙️</span>Admin Panel
        </a>
        <footer>
            Powered by Nx • Deployed on Vercel${!isProduction ? ` • Build: ${timestamp}` : ''}
        </footer>
    </main>
</body>
</html>`;

fs.writeFileSync(path.join(distVercel, 'index.html'), landingHtml);

// Create development headers configuration for cache busting
if (!isProduction) {
  console.log('\n⚙️ Creating development headers configuration...');
  const headersConfig = {
    headers: [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate"
          },
          {
            key: "Pragma", 
            value: "no-cache"
          },
          {
            key: "Expires",
            value: "0"
          },
          {
            key: "X-Cache-Bust",
            value: timestamp.toString()
          }
        ]
      }
    ]
  };
  
  fs.writeFileSync(path.join(distVercel, '_headers.json'), JSON.stringify(headersConfig, null, 2));
}

console.log('\n✅ Vercel build completed successfully!');
console.log(`📂 Output directory: ${distVercel}`);
console.log(`🚀 Ready for ${isProduction ? 'production' : 'development/preview'} deployment on Vercel`);
if (!isProduction) {
  console.log(`🚫 Cache busting enabled with timestamp: ${timestamp}`);
}
