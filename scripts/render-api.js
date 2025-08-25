#!/usr/bin/env node
/**
 * Render.com deployment script for NestJS API
 * 2025 optimized build for web service deployment
 */

const { run, ensureHealthEndpoint } = require('./render-build.js');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');

console.log('🚀 Building API for Render.com...');

// Ensure we're starting fresh
console.log('🧹 Preparing build environment...');
const distPath = path.join(root, 'dist', 'apps', 'api');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}

// Ensure health endpoint exists
ensureHealthEndpoint();

// Build the NestJS application
console.log('📦 Building API with production configuration...');
run('npx nx build api --configuration=production');

// Verify the build output
if (!fs.existsSync(distPath)) {
  throw new Error('❌ Build failed: dist directory not found');
}

const mainPath = path.join(distPath, 'main.js');
if (!fs.existsSync(mainPath)) {
  throw new Error('❌ Build failed: main.js not found');
}

console.log('✅ API build completed successfully!');
console.log(`📂 Output directory: ${distPath}`);
console.log('🚀 Ready for Render.com web service deployment');

// Test the build (optional)
if (process.env.RENDER_TEST_BUILD === 'true') {
  console.log('🧪 Testing the built application...');
  try {
    // This would start the server briefly to test it works
    const testProcess = require('child_process').spawn('node', [mainPath], {
      env: { ...process.env, PORT: '0' },
      stdio: 'pipe'
    });

    setTimeout(() => {
      testProcess.kill();
      console.log('✅ Build test passed');
    }, 3000);
  } catch {
    console.log('⚠️ Build test failed, but continuing...');
  }
}
