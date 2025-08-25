# 🚀 Render.com Migration Guide

This guide walks you through deploying your NX workspace to Render.com after migrating from Vercel.

## 📋 Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Render.com Account**: Sign up at [render.com](https://render.com)
3. **Node.js 18+**: Verify with `node --version`

## 🎯 Deployment Overview

Your workspace will be deployed as:
- **Client Shop**: Static Site (Angular SPA)
- **Admin Panel**: Static Site (Angular SPA)  
- **API**: Web Service (NestJS)

## 📦 Step 1: Deploy Using Blueprint (Recommended)

### Option A: Automatic Blueprint Deployment

1. **Connect Repository**: 
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

2. **Environment Variables**: Set these in Render Dashboard:
   ```bash
   NODE_ENV=production
   NX_SKIP_NX_CACHE=true
   ```

3. **Deploy**: Click "Create Services" and wait for deployment

### Option B: Manual Blueprint Deployment

If automatic detection fails:

1. **Upload Blueprint**:
   - In Render Dashboard, go to "Blueprints"
   - Click "New Blueprint"
   - Upload the `render.yaml` file from your repo root

2. **Configure**: Follow the on-screen prompts

## 🔧 Step 2: Manual Service Creation (Alternative)

If you prefer manual setup:

### Client Shop (Static Site)

1. **Create Static Site**:
   - Service Type: `Static Site`
   - Build Command: `npm ci --ignore-scripts && npx nx build client-shop --configuration=production`
   - Publish Directory: `dist/apps/client-shop/browser`
   - Auto-Deploy: `Yes`

2. **Build Filters** (Monorepo optimization):
   ```
   Include: apps/client-shop/**, shared/**, package.json, nx.json
   Ignore: **/*.spec.ts, **/*.test.ts, **/*.md
   ```

### Admin Panel (Static Site)

1. **Create Static Site**:
   - Service Type: `Static Site`
   - Build Command: `npm ci --ignore-scripts && npx nx build admin-panel --configuration=production`
   - Publish Directory: `dist/apps/admin-panel/browser`
   - Auto-Deploy: `Yes`

2. **Build Filters**:
   ```
   Include: apps/admin-panel/**, shared/**, package.json, nx.json
   Ignore: **/*.spec.ts, **/*.test.ts, **/*.md
   ```

### API (Web Service)

1. **Create Web Service**:
   - Service Type: `Web Service`
   - Build Command: `npm ci --ignore-scripts && npx nx build api --configuration=production`
   - Start Command: `node dist/apps/api/main.js`
   - Auto-Deploy: `Yes`

2. **Environment Variables**:
   ```bash
   NODE_ENV=production
   PORT=3000  # Render automatically sets this
   ```

3. **Health Check**: `/api/health` (already configured)

4. **Build Filters**:
   ```
   Include: apps/api/**, shared/**, package.json, nx.json
   Ignore: **/*.spec.ts, **/*.test.ts, **/*.md
   ```

## 🌐 Step 3: Configure Custom Domains (Optional)

1. **In Render Dashboard**:
   - Go to each service → Settings
   - Add custom domains
   - Follow DNS configuration instructions

2. **SSL**: Automatically provided by Render

## 📊 Step 4: Monitor Deployment

1. **Check Build Logs**: Monitor the initial deployment
2. **Test Services**: Verify all services are running
3. **Health Checks**: API health endpoint should respond at `/api/health`

## 🔄 Step 5: Set Up Automatic Deployments

- **Webhook**: Render automatically deploys on Git pushes
- **Build Filters**: Only relevant services rebuild when code changes
- **Preview Deployments**: Available for pull requests

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Check Node.js version in build logs
   # Ensure all dependencies are in package.json
   # Verify build commands work locally
   ```

2. **Static Site Routing**:
   - SPA routing is configured in `render.yaml`
   - All routes redirect to `index.html`

3. **API Not Starting**:
   - Check PORT environment variable
   - Verify health endpoint responds
   - Review start command

### Build Performance

- **Cache**: Render caches `node_modules` between builds
- **Build Filters**: Only changed services rebuild
- **Dependencies**: Use `npm ci --ignore-scripts` for faster installs

## 📈 Production Optimizations

### Performance
- **CDN**: Automatic global CDN for static sites
- **Compression**: Brotli compression enabled
- **HTTP/2**: Enabled by default
- **Caching**: Optimal cache headers configured

### Security
- **HTTPS**: Automatic SSL certificates
- **Headers**: Security headers configured
- **DDoS Protection**: Built-in protection

### Monitoring
- **Logs**: Real-time logs in dashboard
- **Metrics**: Built-in performance monitoring
- **Alerts**: Configure via email/Slack

## 💰 Cost Considerations

### Free Tier Includes:
- **Static Sites**: Free with usage limits
- **Web Services**: 750 hours/month free
- **Bandwidth**: 100GB/month free

### Scaling:
- **Manual**: Adjust instance count
- **Auto**: Professional plan required

## 🔗 Service URLs

After deployment, your services will be available at:
- **Client Shop**: `https://shoestore-client-shop.onrender.com`
- **Admin Panel**: `https://shoestore-admin-panel.onrender.com`
- **API**: `https://shoestore-api.onrender.com`

## 📚 Additional Resources

- [Render Documentation](https://docs.render.com)
- [Monorepo Support](https://docs.render.com/monorepo-support)
- [Static Sites Guide](https://docs.render.com/static-sites)
- [Web Services Guide](https://docs.render.com/web-services)

## 🎉 Success!

Your NX workspace is now running on Render.com with:
- ✅ Automatic deployments
- ✅ Global CDN
- ✅ SSL certificates
- ✅ Monorepo optimization
- ✅ Health monitoring

Enjoy your modern, scalable deployment! 🚀
