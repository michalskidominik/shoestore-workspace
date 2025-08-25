export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Render.com specific environment variables
  render: {
    isRender: process.env.RENDER === 'true',
    cpuCount: process.env.RENDER_CPU_COUNT || '1',
    instanceId: process.env.RENDER_INSTANCE_ID || 'local',
    serviceName: process.env.RENDER_SERVICE_NAME || 'shoestore-api',
    externalUrl: process.env.RENDER_EXTERNAL_URL || '',
    gitCommit: process.env.RENDER_GIT_COMMIT || '',
    gitBranch: process.env.RENDER_GIT_BRANCH || '',
  },

  // CORS origins for SPA frontends
  cors: {
    origins: [
      'http://localhost:4200',
      'http://localhost:3000',
      process.env.CLIENT_SHOP_URL || 'https://shoestore-client-shop.onrender.com',
      process.env.ADMIN_PANEL_URL || 'https://shoestore-admin-panel.onrender.com',
    ],
  },

  // Health check configuration
  health: {
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD, 10) || 500 * 1024 * 1024, // 500MB
    diskThreshold: parseInt(process.env.DISK_THRESHOLD, 10) || 80, // 80%
  },

  // Performance settings
  performance: {
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableHelmet: process.env.ENABLE_HELMET !== 'false',
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
  },

  // Firebase configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'shoestore-d2e97',
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://shoestore-d2e97-default-rtdb.firebaseio.com',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'shoestore-d2e97.appspot.com',
    // Firebase config JSON - recommended for Render.com deployment
    configJson: process.env.FIREBASE_CONFIG,
    // Individual environment variables (fallback)
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },
});
