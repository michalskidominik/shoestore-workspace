import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthService: HealthService
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
}
