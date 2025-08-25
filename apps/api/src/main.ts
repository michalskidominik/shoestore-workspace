/**
 * Production-ready NestJS API server optimized for Render.com
 * Features: Fastify, CORS, compression, security headers, graceful shutdown
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Use Fastify for better performance (2x faster than Express)
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'production' ? false : true,
      trustProxy: true, // Required for Render.com proxy
    })
  );

  // Global prefix for API routes
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Register Fastify plugins for security, compression, and CORS
  await app.register(require('@fastify/helmet'), {
    crossOriginEmbedderPolicy: false, // Allow SPA integration
    contentSecurityPolicy: false, // Allow SPA flexibility
  });

  await app.register(require('@fastify/compress'), {
    global: true,
  });

  await app.register(require('@fastify/cors'), {
    origin: [
      'http://localhost:4200', // Local development
      'http://localhost:3000', // Local dev server
      process.env.CLIENT_SHOP_URL || 'https://shoestore-client-shop.onrender.com',
      process.env.ADMIN_PANEL_URL || 'https://shoestore-admin-panel.onrender.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Graceful shutdown for Render.com
  app.enableShutdownHooks();

  // Port configuration for Render.com
  const port = process.env.PORT || 3000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  await app.listen(port, host);

  Logger.log(`🚀 API is running on: http://${host}:${port}/${globalPrefix}`);
  Logger.log(`🏥 Health check: http://${host}:${port}/${globalPrefix}/health`);
  Logger.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  Logger.log(`⚡ Platform: Fastify (High Performance)`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application:', error);
  process.exit(1);
});
