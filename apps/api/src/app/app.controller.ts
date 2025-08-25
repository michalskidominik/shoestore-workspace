import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';
import { FirebaseAdminService } from './firebase';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthService: HealthService,
    private readonly firebaseAdminService: FirebaseAdminService
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('/health')
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('/health/ready')
  async getReadiness() {
    const isReady = await this.healthService.isReady();
    return {
      status: isReady ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/health/live')
  getLiveness() {
    return {
      status: this.healthService.isAlive() ? 'alive' : 'dead',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/health/firebase')
  async getFirebaseHealth() {
    try {
      const firebaseHealth = await this.firebaseAdminService.healthCheck();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        firebase: firebaseHealth,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
