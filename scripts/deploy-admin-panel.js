#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying admin-panel to GitHub Pages...');

function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((item) => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  const tempDir = path.join(__dirname, '../temp-admin-panel-deploy');
  const distDir = path.join(__dirname, '../dist/apps/admin-panel/browser');

  // Clean temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  console.log('📥 Cloning gh-pages branch...');
  try {
    execSync(`git clone --depth 1 --branch gh-pages https://github.com/michalskidominik/shoestore-workspace.git "${tempDir}"`, { stdio: 'inherit' });
  } catch {
    console.log('📝 Creating new deployment structure...');
    execSync(`git init "${tempDir}"`, { stdio: 'inherit' });
    execSync('git checkout -b gh-pages', { cwd: tempDir, stdio: 'inherit' });
  }

  // Remove existing admin-panel directory if it exists
  const adminPanelDir = path.join(tempDir, 'admin-panel');
  if (fs.existsSync(adminPanelDir)) {
    fs.rmSync(adminPanelDir, { recursive: true, force: true });
  }

  // Copy built files to admin-panel subdirectory
  console.log('📋 Copying admin-panel files...');
  fs.mkdirSync(adminPanelDir, { recursive: true });
  copyRecursive(distDir, adminPanelDir);

  // Create or update root index.html if it doesn't exist
  const rootIndexPath = path.join(tempDir, 'index.html');
  if (!fs.existsSync(rootIndexPath)) {
    const rootIndexContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MANDRAIME - Applications</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">MANDRAIME</h1>
        <div class="space-y-4">
            <a href="./client-shop/" class="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-3 px-4 rounded-lg transition-colors">
                🛍️ Client Shop
            </a>
            <a href="./admin-panel/" class="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-3 px-4 rounded-lg transition-colors">
                ⚙️ Admin Panel
            </a>
        </div>
        <p class="text-center text-gray-600 mt-6 text-sm">
            Choose your application to continue
        </p>
    </div>
</body>
</html>`;
    fs.writeFileSync(rootIndexPath, rootIndexContent);
  }

  // Deploy using git commands
  console.log('🌐 Deploying to GitHub Pages...');
  process.chdir(tempDir);
  execSync('git add .', { stdio: 'inherit' });
  execSync('git config user.email "action@github.com"', { stdio: 'inherit' });
  execSync('git config user.name "GitHub Actions"', { stdio: 'inherit' });

  try {
    execSync('git commit -m "chore: deploy admin-panel"', { stdio: 'inherit' });
    execSync('git push origin gh-pages', { stdio: 'inherit' });
    console.log('✅ admin-panel deployed successfully!');
  } catch (commitError) {
    console.log('ℹ️ No changes to deploy for admin-panel');
  }
  // Clean up
  try {
    process.chdir(path.join(__dirname, '..'));
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (cleanupError) {
    console.log('⚠️ Cleanup warning:', cleanupError.message);
    console.log('📁 Temp directory may need manual cleanup:', tempDir);
  }

  console.log('🔗 URL: https://michalskidominik.github.io/shoestore-workspace/admin-panel/');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
