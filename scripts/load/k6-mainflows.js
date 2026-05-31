/**
 * k6 smoke load — main public + health paths.
 * Run: k6 run scripts/load/k6-mainflows.js -e BASE_URL=https://www.elevateforhumanity.org
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: Number(__ENV.VUS || 10),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function main() {
  const paths = ['/', '/programs', '/api/health', '/api/ready'];
  for (const path of paths) {
    const res = http.get(`${BASE_URL}${path}`);
    check(res, {
      [`${path} status`]: (r) => r.status === 200 || (path === '/api/ready' && r.status === 503),
    });
  }
  sleep(1);
}
