import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
    service.onModuleInit();
  });

  it('records a request in both the counter and the duration histogram', async () => {
    service.observeRequest('GET', '/risks', 200, 0.042);

    const output = await service.registry.metrics();

    expect(output).toContain('http_requests_total');
    expect(output).toContain('method="GET"');
    expect(output).toContain('route="/risks"');
    expect(output).toContain('status_code="200"');
    expect(output).toContain('http_request_duration_seconds');
  });

  it('exposes Node.js default process metrics', async () => {
    const output = await service.registry.metrics();

    expect(output).toContain('process_cpu_user_seconds_total');
  });
});
