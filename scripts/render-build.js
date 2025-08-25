#!/usr/bin/env node
/**
 * Render.com build script for Angular SPA apps in NX workspace.
 * Optimized for 2025 Render deployment with modern best practices.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function run(cmd) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

function ensureHealthEndpoint() {
  const apiControllerPath = path.join(root, 'apps', 'api', 'src', 'app', 'app.controller.ts');

  if (fs.existsSync(apiControllerPath)) {
    const content = fs.readFileSync(apiControllerPath, 'utf8');

    // Check if health endpoint already exists
    if (!content.includes('/health') && !content.includes('getHealth')) {
      console.log('🏥 Adding health check endpoint to API...');

      // Add health endpoint to the controller
      const updatedContent = content.replace(
        /(@Controller\(\)[\s\S]*?export class AppController {)/,
        `$1

  @Get('/health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'shoestore-api'
    };
  }`
      );

      // Make sure we import Get decorator
      const finalContent = updatedContent.replace(
        /(import.*from '@nestjs\/common';)/,
        `import { Controller, Get } from '@nestjs/common';`
      );

      fs.writeFileSync(apiControllerPath, finalContent);
      console.log('✅ Health endpoint added successfully');
    }
  }
}

console.log('🔨 Building NX workspace for Render.com deployment...');

// Check if this is running in Render's build environment
const isRenderBuild = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

if (isRenderBuild) {
  console.log('🎯 Render.com environment detected');

  // Clean potential problematic cache directories
  const cleanupDirs = [
    path.join(root, '.angular'),
    path.join(root, '.nx/cache'),
    path.join(root, 'node_modules/.cache')
  ];

  cleanupDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`🧹 Cleaning ${dir}...`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

// Ensure health endpoint exists for API
ensureHealthEndpoint();

// Install dependencies if not already done (Render handles this automatically)
if (!fs.existsSync(path.join(root, 'node_modules'))) {
  console.log('📦 Installing dependencies...');
  run('npm ci --ignore-scripts');
}

// Reset Nx cache for fresh build
console.log('🔄 Resetting Nx cache...');
try {
  run('npx nx reset');
} catch {
  console.log('⚠️ Nx reset failed, continuing...');
}

console.log('✅ Build preparation completed successfully!');
console.log('🚀 Ready for Render.com deployment');

// Export functions for use in other scripts
module.exports = {
  run,
  ensureHealthEndpoint
};
