import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/metrics') {
      next();
      return;
    }
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationSeconds =
        Number(process.hrtime.bigint() - start) / 1_000_000_000;
      // req.route is only populated once Express resolves the route, so
      // this reflects the matched pattern (e.g. "/risks/:id"), not raw
      // path params — keeps label cardinality bounded.
      const route =
        (req.route as { path?: string } | undefined)?.path ?? req.path;
      this.metrics.observeRequest(
        req.method,
        route,
        res.statusCode,
        durationSeconds,
      );
    });
    next();
  }
}
