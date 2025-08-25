import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthCheck {
  status: 'ok' | 'error' | 'warning';
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  checks: Record<string, HealthCheck>;
  system: {
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
    cpu: string;
    instance: string;
  };
}

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  async getHealth(): Promise<HealthStatus> {
    const checks: Record<string, HealthCheck> = {};

    // Memory check
    checks.memory = this.checkMemory();

    // Database check (placeholder - implement when DB is added)
    checks.database = await this.checkDatabase();

    // External services check (placeholder)
    checks.externalServices = await this.checkExternalServices();

    // Determine overall status
    const hasErrors = Object.values(checks).some(check => check.status === 'error');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warning');

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (hasErrors) {
      overallStatus = 'unhealthy';
    } else if (hasWarnings) {
      overallStatus = 'degraded';
    }

    const memoryUsage = process.memoryUsage();

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: this.configService.get('render.serviceName', 'shoestore-api'),
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get('nodeEnv'),
      uptime: Math.floor(process.uptime()),
      checks,
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
        cpu: this.configService.get('render.cpuCount', 'unknown'),
        instance: this.configService.get('render.instanceId', 'local'),
      },
    };
  }

  private checkMemory(): HealthCheck {
    const memoryUsage = process.memoryUsage();
    const threshold = this.configService.get('health.memoryThreshold', 500 * 1024 * 1024);

    if (memoryUsage.heapUsed > threshold) {
      return {
        status: 'warning',
        message: 'High memory usage detected',
        details: {
          used: memoryUsage.heapUsed,
          threshold,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
      };
    }

    return {
      status: 'ok',
      message: 'Memory usage within normal limits',
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    // TODO: Implement actual database health check when database is configured
    // For now, return healthy status
    return {
      status: 'ok',
      message: 'Database connection not configured yet',
    };
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    // TODO: Implement checks for external services (Redis, third-party APIs, etc.)
    return {
      status: 'ok',
      message: 'No external services configured',
    };
  }

  async isReady(): Promise<boolean> {
    const health = await this.getHealth();
    return health.status !== 'unhealthy';
  }

  isAlive(): boolean {
    // Simple liveness check - if we can execute this function, we're alive
    return true;
  }
}
