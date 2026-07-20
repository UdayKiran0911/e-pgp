import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

// Intentionally unauthenticated (Prometheus scrapers don't send our JWTs)
// — in a real deployment this endpoint should be restricted at the
// network/ingress layer, not exposed publicly.
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return this.metrics.registry.metrics();
  }
}
