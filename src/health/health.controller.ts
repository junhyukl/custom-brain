import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /**
   * Readiness: Mongo + Qdrant reachable.
   * 200 when status is 'ok', 503 when 'degraded'.
   */
  @Get('health')
  async getHealth() {
    const result = await this.health.check();
    if (result.status === 'degraded') {
      throw new HttpException(result, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return result;
  }
}
