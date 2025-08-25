#!/usr/bin/env node
/**
 * Render.com deployment script for client-shop Angular SPA
 * 2025 optimized build for static site deployment
 */

const { run } = require('./render-build.js');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');

console.log('🛍️ Building client-shop for Render.com...');

// Ensure we're starting fresh
console.log('🧹 Preparing build environment...');
const distPath = path.join(root, 'dist', 'apps', 'client-shop');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}

// Build the Angular application
console.log('📦 Building client-shop with production configuration...');
run('npx nx build client-shop --configuration=production');

// Verify the build output
const browserPath = path.join(distPath, 'browser');
if (!fs.existsSync(browserPath)) {
  throw new Error('❌ Build failed: browser output directory not found');
}

const indexPath = path.join(browserPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  throw new Error('❌ Build failed: index.html not found');
}

console.log('✅ Client-shop build completed successfully!');
console.log(`📂 Output directory: ${browserPath}`);
console.log('🚀 Ready for Render.com static site deployment');
