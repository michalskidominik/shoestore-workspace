#!/usr/bin/env node
/**
 * Nx-aware Vercel build script for Angular SPA apps.
 * Builds multiple Angular apps and structures output for Vercel deployment.
 * Optimized for 2025 Vercel + Nx best practices.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distVercel = path.join(root, 'dist-vercel');

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

console.log('🔨 Building Nx workspace for Vercel deployment...');

// Clean previous build
rimraf(distVercel);
fs.mkdirSync(distVercel, { recursive: true });

// Build both Angular apps with production configuration
console.log('\n📦 Building Angular applications...');
run('npx nx build client-shop --configuration=production');
run('npx nx build admin-panel --configuration=production');

// Copy build outputs to Vercel structure
const clientOut = path.join(root, 'dist', 'apps', 'client-shop', 'browser');
const adminOut = path.join(root, 'dist', 'apps', 'admin-panel', 'browser');

console.log('\n📁 Structuring output for Vercel...');
copyDir(clientOut, path.join(distVercel, 'client-shop'));
copyDir(adminOut, path.join(distVercel, 'admin-panel'));

// Create root landing page
const landingHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shoestore Applications</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
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
    <main>
        <h1>Shoestore</h1>
        <p class="subtitle">Select an application to continue</p>
        <a class="card" href="/client-shop/">
            <span class="card-emoji">🛍️</span>Client Shop
        </a>
        <a class="card" href="/admin-panel/">
            <span class="card-emoji">⚙️</span>Admin Panel
        </a>
        <footer>
            Powered by Nx • Deployed on Vercel
        </footer>
    </main>
</body>
</html>`;

fs.writeFileSync(path.join(distVercel, 'index.html'), landingHtml);

console.log('\n✅ Vercel build completed successfully!');
console.log(`📂 Output directory: ${distVercel}`);
console.log('🚀 Ready for deployment on Vercel');
