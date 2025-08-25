#!/usr/bin/env node
/**
 * Render.com deployment script for admin-panel Angular SPA
 * 2025 optimized build for static site deployment
 */

const { run } = require('./render-build.js');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');

console.log('⚙️ Building admin-panel for Render.com...');

// Ensure we're starting fresh
console.log('🧹 Preparing build environment...');
const distPath = path.join(root, 'dist', 'apps', 'admin-panel');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}

// Build the Angular application
console.log('📦 Building admin-panel with production configuration...');
run('npx nx build admin-panel --configuration=production');

// Verify the build output
const browserPath = path.join(distPath, 'browser');
if (!fs.existsSync(browserPath)) {
  throw new Error('❌ Build failed: browser output directory not found');
}

const indexPath = path.join(browserPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  throw new Error('❌ Build failed: index.html not found');
}

console.log('✅ Admin-panel build completed successfully!');
console.log(`📂 Output directory: ${browserPath}`);
console.log('🚀 Ready for Render.com static site deployment');
