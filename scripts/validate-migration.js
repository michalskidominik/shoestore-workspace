#!/usr/bin/env node
/**
 * Render.com Migration Validation Script
 * Ensures all migration steps are completed and services are ready for deployment
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

console.log('🔍 Validating Render.com migration...\n');

// Track validation results
const validationErrors = [];
const validationWarnings = [];
const validationPassed = [];

function checkFile(filePath, description, required = true) {
  const fullPath = path.join(root, filePath);
  if (fs.existsSync(fullPath)) {
    validationPassed.push(`✅ ${description}: Found`);
    return true;
  } else {
    if (required) {
      validationErrors.push(`❌ ${description}: Missing - ${filePath}`);
    } else {
      validationWarnings.push(`⚠️ ${description}: Not found (optional) - ${filePath}`);
    }
    return false;
  }
}

function checkFileContains(filePath, searchText, description) {
  const fullPath = path.join(root, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes(searchText)) {
      validationPassed.push(`✅ ${description}: Configured`);
      return true;
    } else {
      validationWarnings.push(`⚠️ ${description}: Not found in ${filePath}`);
      return false;
    }
  } else {
    validationErrors.push(`❌ ${description}: File missing - ${filePath}`);
    return false;
  }
}

function checkFileNotExists(filePath, description) {
  const fullPath = path.join(root, filePath);
  if (!fs.existsSync(fullPath)) {
    validationPassed.push(`✅ ${description}: Removed`);
    return true;
  } else {
    validationWarnings.push(`⚠️ ${description}: Still exists - ${filePath}`);
    return false;
  }
}

// 1. Check required Render files
console.log('📋 Checking Render configuration files...');
checkFile('render.yaml', 'Render Blueprint');
checkFile('RENDER_DEPLOYMENT_GUIDE.md', 'Deployment Guide');
checkFile('.renderignore', 'Render Ignore File', false);

// 2. Check new build scripts
console.log('\n📦 Checking build scripts...');
checkFile('scripts/render-build.js', 'Main Render Build Script');
checkFile('scripts/render-client-shop.js', 'Client Shop Build Script');
checkFile('scripts/render-admin-panel.js', 'Admin Panel Build Script');
checkFile('scripts/render-api.js', 'API Build Script');

// 3. Check package.json updates
console.log('\n📄 Checking package.json...');
checkFileContains('package.json', 'build:render', 'Render Build Scripts');
checkFileContains('package.json', 'build:render:client-shop', 'Client Shop Script');
checkFileContains('package.json', 'build:render:admin-panel', 'Admin Panel Script');
checkFileContains('package.json', 'build:render:api', 'API Script');

// 4. Check API health endpoint
console.log('\n🏥 Checking API health endpoint...');
checkFileContains('apps/api/src/app/app.controller.ts', '/health', 'Health Endpoint');
checkFileContains('apps/api/src/app/app.controller.ts', 'getHealth', 'Health Method');

// 5. Check that Vercel files are removed
console.log('\n🗑️ Checking Vercel cleanup...');
checkFileNotExists('vercel.json', 'Vercel Config');
checkFileNotExists('scripts/vercel-build.js', 'Vercel Build Script');
checkFileNotExists('scripts/deploy-admin-panel.js', 'Old Admin Panel Deploy Script');
checkFileNotExists('scripts/deploy-client-shop.js', 'Old Client Shop Deploy Script');
checkFileNotExists('dist-vercel', 'Vercel Dist Directory');
checkFileNotExists('VERCEL_QUICK_REF.md', 'Vercel Quick Reference');
checkFileNotExists('VERCEL_SETUP_GUIDE.md', 'Vercel Setup Guide');

// 6. Check workspace structure
console.log('\n🏗️ Checking workspace structure...');
checkFile('apps/client-shop/project.json', 'Client Shop Project Config');
checkFile('apps/admin-panel/project.json', 'Admin Panel Project Config');
checkFile('apps/api/project.json', 'API Project Config');
checkFile('shared/shared-models/project.json', 'Shared Models Project Config');

// 7. Check NX configuration
console.log('\n⚡ Checking NX configuration...');
checkFile('nx.json', 'NX Configuration');
checkFile('package.json', 'Root Package JSON');

// 8. Validate render.yaml structure
console.log('\n🔧 Validating Render Blueprint...');
const renderYamlPath = path.join(root, 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
  const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');

  if (renderYaml.includes('shoestore-client-shop')) {
    validationPassed.push('✅ Client Shop service defined in Blueprint');
  } else {
    validationErrors.push('❌ Client Shop service missing from Blueprint');
  }

  if (renderYaml.includes('shoestore-admin-panel')) {
    validationPassed.push('✅ Admin Panel service defined in Blueprint');
  } else {
    validationErrors.push('❌ Admin Panel service missing from Blueprint');
  }

  if (renderYaml.includes('shoestore-api')) {
    validationPassed.push('✅ API service defined in Blueprint');
  } else {
    validationErrors.push('❌ API service missing from Blueprint');
  }

  if (renderYaml.includes('buildFilter')) {
    validationPassed.push('✅ Build filters configured (monorepo optimization)');
  } else {
    validationWarnings.push('⚠️ Build filters not configured');
  }
}

// 9. Final summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (validationPassed.length > 0) {
  console.log(`\n✅ PASSED (${validationPassed.length}):`);
  validationPassed.forEach(item => console.log(`  ${item}`));
}

if (validationWarnings.length > 0) {
  console.log(`\n⚠️ WARNINGS (${validationWarnings.length}):`);
  validationWarnings.forEach(item => console.log(`  ${item}`));
}

if (validationErrors.length > 0) {
  console.log(`\n❌ ERRORS (${validationErrors.length}):`);
  validationErrors.forEach(item => console.log(`  ${item}`));
}

console.log('\n' + '='.repeat(60));

if (validationErrors.length === 0) {
  console.log('🎉 MIGRATION VALIDATION SUCCESSFUL!');
  console.log('🚀 Your workspace is ready for Render.com deployment!');
  console.log('\n📖 Next steps:');
  console.log('   1. Push your changes to GitHub');
  console.log('   2. Follow the deployment guide: RENDER_DEPLOYMENT_GUIDE.md');
  console.log('   3. Create services on Render.com');
  console.log('   4. Enjoy your new deployment! 🎊');
} else {
  console.log('❌ MIGRATION VALIDATION FAILED!');
  console.log('🔧 Please fix the errors above before proceeding with deployment.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
