# 🛍️ Shoestore NX Workspace

A modern e-commerce platform built with NX monorepo, Angular, and NestJS, optimized for deployment on Render.com.

## 🏗️ Architecture

- **client-shop**: Customer-facing Angular SPA
- **admin-panel**: Administrative Angular SPA  
- **api**: NestJS REST API backend
- **shared/shared-models**: Shared TypeScript models
- **shared/shared-utils**: Shared utilities

## 🚀 Deployment Status

**Platform**: Render.com  

### Live Services
- 🛍️ **Client Shop**: [Production URL](https://shoestore-client-shop.onrender.com)
- ⚙️ **Admin Panel**: [Production URL](https://shoestore-admin-panel.onrender.com)
- 🚀 **API**: [Production URL](https://shoestore-api.onrender.com)

## 📋 Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development servers
npx nx serve client-shop    # Port 4200
npx nx serve admin-panel    # Port 4201  
npx nx serve api           # Port 3000

# Run tests
npx nx test client-shop
npx nx test admin-panel
npx nx test api
```

### Production Builds
```bash
# Build all applications
npx nx build client-shop --configuration=production
npx nx build admin-panel --configuration=production
npx nx build api --configuration=production

# Or use Render-optimized scripts
npm run build:render:client-shop
npm run build:render:admin-panel
npm run build:render:api
```

## 🌐 Deployment

### Automatic Deployment (Recommended)

1. **Push to GitHub**: Changes automatically trigger deployment
2. **Blueprint Configuration**: Uses `render.yaml` for infrastructure as code
3. **Build Optimization**: Only affected services rebuild (monorepo support)

### Manual Deployment

Follow the comprehensive guide: [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)

## 🛠️ Development Tools

- **NX**: Monorepo management and build optimization
- **Angular**: Frontend frameworks (v19+)
- **NestJS**: Backend API framework
- **TypeScript**: Type-safe development
- **Jest**: Testing framework
- **ESLint**: Code linting
- **TailwindCSS**: Utility-first CSS framework

## 📊 Build Configuration

### Static Sites (Angular SPAs)
- **Build Command**: `npm ci --ignore-scripts && npx nx build [app] --configuration=production`
- **Output**: `dist/apps/[app]/browser`
- **Routing**: SPA routing configured for client-side navigation
- **Caching**: Optimized cache headers for static assets

### Web Service (NestJS API)
- **Build Command**: `npm ci --ignore-scripts && npx nx build api --configuration=production`
- **Start Command**: `node dist/apps/api/main.js`
- **Health Check**: `/api/health`
- **Port**: Automatically configured by Render

## 🔧 Environment Variables

### Production (Set in Render Dashboard)
```bash
NODE_ENV=production
NX_SKIP_NX_CACHE=true
PORT=3000  # For API service (auto-set by Render)
```

### Development (.env.local)
```bash
NODE_ENV=development
API_URL=http://localhost:3000
```

## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:
```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
