# Shoestore API - Production-Ready NestJS Backend

## Overview

High-performance NestJS API optimized for Render.com deployment with Angular SPA frontends.

## Architecture

- **Framework**: NestJS with Fastify (2x faster than Express)
- **Platform**: Node.js 20 LTS
- **Deployment**: Render.com web services
- **Build Tool**: Nx with Webpack optimization
- **Security**: @fastify/helmet, @fastify/cors, input validation
- **Performance**: @fastify/compress, caching, optimized builds

## Features

### 🚀 Performance Optimizations
- Fastify HTTP adapter for better performance
- Native Fastify compression (@fastify/compress)
- Production webpack optimization
- Memory and CPU monitoring
- Graceful shutdown handling

### 🔒 Security
- Fastify security headers (@fastify/helmet)
- CORS configured for SPA frontends (@fastify/cors)
- Input validation with class-validator
- Environment-based configuration

### 🏥 Health Monitoring
- Comprehensive health checks
- Memory usage monitoring
- Readiness and liveness probes
- Render.com integration metrics

### 🌐 Render.com Integration
- Zero-downtime deployments
- Health check endpoint configuration
- Environment variable management
- Build optimization for fast deploys

## API Endpoints

### Health Checks
- `GET /api/health` - Comprehensive health status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Application
- `GET /api` - Application data

## Environment Variables

### Required
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

### Optional
- `CLIENT_SHOP_URL` - Frontend shop URL for CORS
- `ADMIN_PANEL_URL` - Admin panel URL for CORS
- `MEMORY_THRESHOLD` - Memory warning threshold in bytes
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

### Render.com Automatic
- `RENDER` - Set to 'true' on Render
- `RENDER_CPU_COUNT` - Available CPU count
- `RENDER_INSTANCE_ID` - Instance identifier
- `RENDER_SERVICE_NAME` - Service name
- `RENDER_EXTERNAL_URL` - External service URL

## Development

### Prerequisites
- Node.js 20 LTS
- npm 10+

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run serve api

# Build for production
npm run build api
```

### Testing
```bash
# Unit tests
npm run test api

# E2E tests
npm run test:e2e api-e2e
```

## Deployment

### Render.com Configuration
The API is configured for automatic deployment on Render.com with:

1. **Build Command**: Handled by `render.yaml` blueprint
2. **Start Command**: `node dist/apps/api/main.js`
3. **Health Check**: `/api/health`
4. **Port**: Auto-configured from `PORT` environment variable

### Environment Setup
1. Set environment variables in Render dashboard
2. Configure CORS origins for your frontend URLs
3. Monitor health checks and logs

### Performance Monitoring
- Memory usage tracked in health endpoint
- Request/response times logged
- Error rates monitored
- CPU usage from Render metrics

## Best Practices Implemented

### 🏗️ Architecture
- Modular configuration management
- Separation of concerns
- Type-safe environment handling
- Graceful error handling
- Native Fastify plugins for optimal performance

### 🚀 Performance
- HTTP/2 ready with Fastify
- Native Fastify compression middleware
- Optimized webpack builds
- Memory leak prevention

### 🔐 Security
- Fastify security headers (@fastify/helmet)
- CORS properly configured (@fastify/cors)
- Input validation and sanitization
- Environment-based secrets

### 📊 Monitoring
- Structured logging
- Health check endpoints
- Performance metrics
- Error tracking

## Scaling Considerations

### Horizontal Scaling
- Stateless design for easy scaling
- Health checks for load balancer integration
- Graceful shutdown for zero-downtime deploys

### Performance Tuning
- Memory thresholds configured
- CPU usage monitoring
- Database connection pooling (when added)
- Cache strategies (when needed)

## Future Enhancements

1. **Database Integration**
   - PostgreSQL with connection pooling
   - Health checks for database connectivity
   - Migration management

2. **Authentication & Authorization**
   - JWT token management
   - Role-based access control
   - Session management

3. **Caching**
   - Redis integration
   - Response caching
   - Session storage

4. **API Documentation**
   - OpenAPI/Swagger integration
   - Automated API documentation
   - Request/response examples

5. **Advanced Monitoring**
   - APM integration (Datadog, New Relic)
   - Custom metrics
   - Alert configuration
   - Performance dashboards

## Troubleshooting

### Common Issues
1. **Memory leaks**: Monitor `/api/health` endpoint
2. **CORS errors**: Check environment variables for frontend URLs
3. **Health check failures**: Review `/api/health/ready` response
4. **Slow responses**: Enable performance logging

### Debug Mode
Set `LOG_LEVEL=debug` for detailed logging during development.

### Performance Issues
1. Check memory usage in health endpoint
2. Monitor CPU usage in Render dashboard
3. Review request patterns
4. Optimize database queries (when added)
