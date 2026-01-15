import http from 'k6/http';
import exec from 'k6/execution';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:43261';

const DEFAULT_CRUD_VUS = parseInt(__ENV.CRUD_VUS || '5', 10);
const DEFAULT_CRUD_ITERS = parseInt(__ENV.CRUD_ITERS || '2', 10);
const DEFAULT_CONFLICT_ITERS = parseInt(__ENV.CONFLICT_ITERS || '10', 10);
const DEFAULT_UNIQUE_ITERS = parseInt(__ENV.UNIQUE_ITERS || '10', 10);
const DEFAULT_READ_VUS = parseInt(__ENV.READ_VUS || '1', 10);
const DEFAULT_READ_ITERS = parseInt(__ENV.READ_ITERS || '1000', 10);

const READY_TIMEOUT_SEC = parseFloat(__ENV.READY_TIMEOUT_SEC || '60');
const READY_INTERVAL_SEC = parseFloat(__ENV.READY_INTERVAL_SEC || '0.5');
const READY_PATH = __ENV.READY_PATH || '/persons?page=0&size=1';

function apiHeaders(username, role, contentType) {
  const headers = { 'X-User': username, 'X-Role': role };
  if (contentType) headers['Content-Type'] = contentType;
  return headers;
}

function jsonParams(username, role) {
  return { headers: apiHeaders(username, role, 'application/json') };
}

function multipartParams(username, role) {
  return { headers: apiHeaders(username, role) };
}

function uniqueSuffix(prefix) {
  const now = Date.now();
  const vu = exec.vu.idInTest;
  const iter = exec.scenario.iterationInTest;
  const rand = Math.floor(Math.random() * 1e9);
  return `${prefix}_${now}_${vu}_${iter}_${rand}`;
}

function personPayload(name, overrides = {}) {
  return JSON.stringify({
    id: null,
    name,
    creationDate: null,
    eyeColor: 'GREEN',
    hairColor: 'BROWN',
    nationality: 'ITALY',
    height: 170,
    coordinates: { id: null, x: 10, y: 20.5 },
    location: { id: null, x: 1, y: 2.2, z: 3, name: `Loc_${name}` },
    ...overrides,
  });
}

function createPerson(name, username, role) {
  const res = http.post(`${BASE_URL}/persons`, personPayload(name), jsonParams(username, role));
  check(res, { 'POST /persons -> 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json().id;
}

function updatePerson(id, name, username, role) {
  const res = http.put(`${BASE_URL}/persons/${id}`, personPayload(name), jsonParams(username, role));
  check(res, { 'PUT /persons/{id} -> 200': (r) => r.status === 200 });
  return res;
}

function deletePerson(id, username, role) {
  return http.del(`${BASE_URL}/persons/${id}`, null, jsonParams(username, role));
}

function personsImportYaml(nameA, nameB) {
  return `persons:
  - name: ${nameA}
    height: 170
    eyeColor: GREEN
    hairColor: BROWN
    nationality: ITALY
    coordinates:
      x: 10
      y: 25.5
    location:
      x: 1
      y: 2.2
      z: 3
      name: K6-Loc-A
  - name: ${nameB}
    height: 185
    eyeColor: ORANGE
    hairColor: WHITE
    nationality: INDIA
    coordinates:
      x: 20
      y: 30.0
    location:
      x: -5
      y: 7.1
      z: 9
      name: K6-Loc-B
`;
}

function locationsImportYaml(suffix) {
  return `locations:
  - name: K6-${suffix}-1
    x: 5
    y: 12.5
    z: 3
  - name: K6-${suffix}-2
    x: -3
    y: 9.2
    z: 15
`;
}

export const options = {
  scenarios: {
    crud_and_import: {
      executor: 'per-vu-iterations',
      vus: DEFAULT_CRUD_VUS,
      iterations: DEFAULT_CRUD_ITERS,
      maxDuration: '2m',
      exec: 'crudAndImport',
    },
    conflict_update_delete: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: DEFAULT_CONFLICT_ITERS,
      startTime: '5s',
      maxDuration: '2m',
      exec: 'concurrentUpdateDelete',
    },
    conflict_delete_delete: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: DEFAULT_CONFLICT_ITERS,
      startTime: '10s',
      maxDuration: '2m',
      exec: 'concurrentDeleteDelete',
    },
    unique_name_race: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: DEFAULT_UNIQUE_ITERS,
      startTime: '15s',
      maxDuration: '2m',
      exec: 'uniqueCreateRace',
    },
    read_heavy: {
      executor: 'per-vu-iterations',
      vus: DEFAULT_READ_VUS,
      iterations: DEFAULT_READ_ITERS,
      startTime: '20s',
      maxDuration: '3m',
      exec: 'readOnly',
    },
  },
};

export function setup() {
  const timeoutMs = READY_TIMEOUT_SEC * 1000;
  const deadline = Date.now() + timeoutMs;

  let lastStatus = 0;
  let lastError = '';

  while (Date.now() < deadline) {
    const res = http.get(`${BASE_URL}${READY_PATH}`, { timeout: '5s' });
    lastStatus = res.status;
    lastError = res.error || '';

    if (res.status === 200) {
      return { ready: true };
    }

    sleep(READY_INTERVAL_SEC);
  }

  throw new Error(
    `Backend is not ready after ${READY_TIMEOUT_SEC}s (GET ${BASE_URL}${READY_PATH} -> status=${lastStatus} error=${lastError})`,
  );
}

export function crudAndImport() {
  const username = `k6_user_${exec.vu.idInTest}`;
  const admin = `k6_admin_${exec.vu.idInTest}`;

  group('CRUD', () => {
    const name = uniqueSuffix('K6_CRUD');
    const id = createPerson(name, username, 'USER');
    if (!id) return;

    const updatedName = uniqueSuffix('K6_CRUD_UPD');
    updatePerson(id, updatedName, username, 'USER');

    const del = deletePerson(id, username, 'USER');
    check(del, { 'DELETE /persons/{id} -> 200': (r) => r.status === 200 });
  });

  group('Import', () => {
    const importA = uniqueSuffix('K6_Import_A');
    const importB = uniqueSuffix('K6_Import_B');
    const personsYaml = personsImportYaml(importA, importB);
    const personsRes = http.post(
      `${BASE_URL}/persons/import`,
      { file: http.file(personsYaml, 'persons-import.yaml', 'application/x-yaml') },
      multipartParams(username, 'USER'),
    );
    check(personsRes, { 'POST /persons/import -> 200': (r) => r.status === 200 });

    const locSuffix = uniqueSuffix('Locations');
    const locationsYaml = locationsImportYaml(locSuffix);
    const locationsRes = http.post(
      `${BASE_URL}/location/import`,
      { file: http.file(locationsYaml, 'locations-import.yaml', 'application/x-yaml') },
      multipartParams(admin, 'ADMIN'),
    );
    check(locationsRes, { 'POST /location/import -> 200': (r) => r.status === 200 });
  });

  sleep(0.2);
}

export function concurrentUpdateDelete() {
  const seedId = createPerson(uniqueSuffix('K6_Seed_UD'), 'k6_seed_admin', 'ADMIN');
  if (!seedId) return;

  const updateBody = personPayload(uniqueSuffix('K6_UpdAfterSeed'));
  const [updateRes, deleteRes] = http.batch([
    ['PUT', `${BASE_URL}/persons/${seedId}`, updateBody, jsonParams('k6_admin_updater', 'ADMIN')],
    ['DELETE', `${BASE_URL}/persons/${seedId}`, null, jsonParams('k6_admin_deleter', 'ADMIN')],
  ]);

  check(updateRes, {
    'concurrent PUT -> 200/404/409': (r) => [200, 404, 409].includes(r.status),
  });
  check(deleteRes, {
    'concurrent DELETE -> 200/404': (r) => [200, 404].includes(r.status),
  });

  const final = http.get(`${BASE_URL}/persons/${seedId}`, jsonParams('k6_admin_audit', 'ADMIN'));
  check(final, { 'after delete person is gone (404)': (r) => r.status === 404 });
}

export function concurrentDeleteDelete() {
  const seedId = createPerson(uniqueSuffix('K6_Seed_DD'), 'k6_seed_admin', 'ADMIN');
  if (!seedId) return;

  const [d1, d2] = http.batch([
    ['DELETE', `${BASE_URL}/persons/${seedId}`, null, jsonParams('k6_admin_del_1', 'ADMIN')],
    ['DELETE', `${BASE_URL}/persons/${seedId}`, null, jsonParams('k6_admin_del_2', 'ADMIN')],
  ]);

  const statuses = [d1.status, d2.status].sort((a, b) => a - b).join(',');
  check(null, { 'one delete wins, one gets 404': () => statuses === '200,404' });
}

export function uniqueCreateRace() {
  const raceName = uniqueSuffix('K6_UniqueRace');
  const body = personPayload(raceName);

  const [r1, r2] = http.batch([
    ['POST', `${BASE_URL}/persons`, body, jsonParams('k6_race_user_1', 'USER')],
    ['POST', `${BASE_URL}/persons`, body, jsonParams('k6_race_user_2', 'USER')],
  ]);

  const ok = [r1, r2].filter((r) => r.status === 200);
  const bad = [r1, r2].filter((r) => r.status === 400);
  check(null, { 'exactly one create succeeds': () => ok.length === 1 && bad.length === 1 });

  const winnerId = ok.length === 1 ? ok[0].json().id : null;
  if (winnerId) {
    const del = deletePerson(winnerId, 'k6_race_admin', 'ADMIN');
    check(del, { 'cleanup delete -> 200': (r) => r.status === 200 });

    const availability = http.get(
      `${BASE_URL}/persons/check-name?name=${encodeURIComponent(raceName)}`,
      jsonParams('k6_race_admin', 'ADMIN'),
    );
    check(availability, {
      'name is available after cleanup': (r) => r.status === 200 && r.json().available === true,
    });
  }
}

function readPage(username, role) {
  const page = Math.floor(Math.random() * 20);
  const res = http.get(`${BASE_URL}/persons?page=${page}&size=20`, jsonParams(username, role));
  check(res, { 'GET /persons -> 200': (r) => r.status === 200 });
}

export function readOnly() {
  const username = `k6_reader_${exec.vu.idInTest}`;
  readPage(username, 'USER');
}
