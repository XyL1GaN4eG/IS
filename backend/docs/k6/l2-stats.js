import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:43261';

const DEFAULT_READ_ITERS = parseInt(__ENV.READ_ITERS || '50', 10);

function apiHeaders(contentType) {
  const headers = { 'X-User': 'k6_monitor', 'X-Role': 'ADMIN' };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
}

function logCurrentStats(label) {
  const res = http.get(`${BASE_URL}/cache/l2/stats`, { headers: apiHeaders() });
  check(res, { 'GET /cache/l2/stats -> 200': (r) => r.status === 200 });
  console.log(`${label}: ${JSON.stringify(res.json())}`);
}

export function setup() {
  http.put(`${BASE_URL}/cache/l2/logging?enabled=true`, null, { headers: apiHeaders() });
  logCurrentStats('initial');
}

export default function () {
  for (let i = 0; i < DEFAULT_READ_ITERS; i++) {
    const page = i % 5;
    const res = http.get(`${BASE_URL}/persons?page=${page}&size=10`, { headers: apiHeaders() });
    check(res, { 'GET /persons -> 200': (r) => r.status === 200 });
    if (i % 10 === 0) {
      logCurrentStats(`after ${i + 1} reads`);
    }
    sleep(0.1);
  }
}

export function teardown() {
  logCurrentStats('final');
  http.put(`${BASE_URL}/cache/l2/logging?enabled=false`, null, { headers: apiHeaders() });
}
