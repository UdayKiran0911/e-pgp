// Performance Testing (Phase 10 Module 8): a k6 load-test script exercising
// the governance workflow's read path — login, list projects, list risks —
// against a running API instance. Not wired into CI (needs a real target
// environment + threshold-tuning decision), run manually:
//
//   k6 run apps/api/perf/governance-workflow.k6.js \
//     -e BASE_URL=http://localhost:4000 \
//     -e EMAIL=admin@example.com \
//     -e PASSWORD=your-password
//
// Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;

export const options = {
  scenarios: {
    governance_read_path: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  if (!EMAIL || !PASSWORD) {
    throw new Error('Set -e EMAIL=... -e PASSWORD=... for a real account.');
  }
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login succeeded': (r) => r.status === 201 || r.status === 200 });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const headers = { Authorization: `Bearer ${data.token}` };

  const projects = http.get(`${BASE_URL}/projects`, { headers });
  check(projects, { 'list projects: 200': (r) => r.status === 200 });

  const projectList = projects.json();
  if (Array.isArray(projectList) && projectList.length > 0) {
    const projectId = projectList[0].id;

    const risks = http.get(`${BASE_URL}/risks?projectId=${projectId}`, { headers });
    check(risks, { 'list risks: 200': (r) => r.status === 200 });

    const health = http.get(`${BASE_URL}/projects/${projectId}/health-score`, {
      headers,
    });
    check(health, { 'health score: 200': (r) => r.status === 200 });
  }

  sleep(1);
}
