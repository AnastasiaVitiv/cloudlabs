import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL =
  __ENV.BASE_URL ||
  'http://web1lab-alb-1900727318.eu-central-1.elb.amazonaws.com';

const VUS = Number(__ENV.VUS || 10);
const CACHE_MODE = (__ENV.CACHE_MODE || 'enabled').toLowerCase();

const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');
const cacheBypass = new Counter('cache_bypass');

export const options = {
  stages: [
    { duration: '3m', target: VUS },
    { duration: '5m', target: VUS },
    { duration: '2m', target: 0 },
  ],

  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(50)',
    'p(95)',
    'p(99)',
  ],

  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};

function requestParams(operation) {
  return {
    headers: CACHE_MODE === 'bypass'
      ? { 'X-Cache-Mode': 'bypass' }
      : {},
    tags: { operation },
  };
}

function recordCache(response) {
  const status = response.headers['X-Cache'];

  if (status === 'HIT') {
    cacheHits.add(1);
  } else if (status === 'MISS') {
    cacheMisses.add(1);
  } else if (status === 'BYPASS') {
    cacheBypass.add(1);
  }
}

export default function () {
  const payload = {
    name: `Loadtest-${__VU}-${__ITER}-${Date.now()}`,
    tonnage: 1000,
    passengers: 200,
    captain: `Test Captain ${__VU}`,
    speed: 30,
    mileage: 10000,
    price_per_ton: 50,
    price_per_person: 100,
    description: 'Test ship created by k6',
    image: '/images/ship1.jpg',
  };

  const postResponse = http.post(
    `${BASE_URL}/api/ships`,
    JSON.stringify(payload),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { operation: 'write' },
    }
  );

  const postOk = check(postResponse, {
    'POST creates a ship': (r) => r.status === 201,
  });

  let createdShipId = null;

  if (postOk) {
    try {
      createdShipId = postResponse.json('id');
    } catch (error) {
      console.error(`Cannot read created ship ID: ${error}`);
    }
  }

  const listResponse = http.get(
    `${BASE_URL}/api/ships?limit=100`,
    requestParams('list')
  );

  recordCache(listResponse);

  check(listResponse, {
    'GET ships list successful': (r) => r.status === 200,
  });

  let ships = [];

  try {
    const body = listResponse.json();
    if (Array.isArray(body)) {
      ships = body;
    }
  } catch (error) {
    console.error(`Cannot parse ships list: ${error}`);
  }

  for (let i = 0; i < 8; i++) {
    let shipId;

    if (i === 0 && createdShipId) {
      shipId = createdShipId;
    } else if (ships.length > 0) {
      shipId = ships[i % ships.length].id;
    } else {
      shipId = 1;
    }

    const detailResponse = http.get(
      `${BASE_URL}/api/ships/${shipId}`,
      requestParams('ship_detail')
    );

    recordCache(detailResponse);

    check(detailResponse, {
      'GET single ship successful': (r) => r.status === 200,
    });

    if (i === 0 && createdShipId && detailResponse.status === 200) {
      check(detailResponse.json(), {
        'Ship contains captain information': (ship) =>
          ship.captain !== undefined && ship.captain !== null,
      });
    }
  }

  sleep(2);
}