/**
 * k6 Baseline Load Test
 *
 * Purpose: Establish performance baseline under normal load conditions.
 * Run: k6 run tests/load/baseline.ts
 *
 * Configuration:
 * - 10 virtual users (VUs)
 * - 30 second duration
 * - Tests public endpoints and auth flows
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    // Response time thresholds
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    // Error rate threshold
    errors: ['rate<0.01'], // Less than 1% errors
    // Custom metric thresholds
    login_duration: ['p(95)<1000'],
    api_duration: ['p(95)<300'],
  },
  tags: {
    testType: 'baseline',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testUser = {
  email: __ENV.TEST_USER_EMAIL || 'loadtest@example.com',
  password: __ENV.TEST_USER_PASSWORD || 'TestPassword123!',
};

export default function () {
  // ==========================================================================
  // 1. Health Check (Public)
  // ==========================================================================
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health_check' },
  });

  check(healthRes, {
    'health check status 200': (r) => r.status === 200,
    'health check has status': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.status === 'healthy' || body.status === 'ok';
      } catch {
        return false;
      }
    },
  }) || errorRate.add(1);

  sleep(0.5);

  // ==========================================================================
  // 2. Landing Page (Public)
  // ==========================================================================
  const landingRes = http.get(`${BASE_URL}/`, {
    tags: { name: 'landing_page' },
  });

  check(landingRes, {
    'landing page status 200': (r) => r.status === 200,
    'landing page has content': (r) => r.body !== undefined && (r.body as string).length > 0,
  }) || errorRate.add(1);

  sleep(0.5);

  // ==========================================================================
  // 3. Login Page (Public)
  // ==========================================================================
  const loginPageRes = http.get(`${BASE_URL}/login`, {
    tags: { name: 'login_page' },
  });

  check(loginPageRes, {
    'login page status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.3);

  // ==========================================================================
  // 4. API Endpoints (Public - if any exist)
  // ==========================================================================
  const profileListRes = http.get(`${BASE_URL}/api/profile`, {
    tags: { name: 'profile_list' },
  });

  const profileCheck = check(profileListRes, {
    'profile list status 200': (r) => r.status === 200,
    'profile list is array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  });

  if (!profileCheck) errorRate.add(1);
  apiDuration.add(profileListRes.timings.duration);
  sleep(0.3);

  const clientListRes = http.get(`${BASE_URL}/api/client`, {
    tags: { name: 'client_list' },
  });

  const clientCheck = check(clientListRes, {
    'client list status 200': (r) => r.status === 200,
    'client list is array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  });

  if (!clientCheck) errorRate.add(1);
  apiDuration.add(clientListRes.timings.duration);
  sleep(0.3);

  const serviceListRes = http.get(`${BASE_URL}/api/service`, {
    tags: { name: 'service_list' },
  });

  const serviceCheck = check(serviceListRes, {
    'service list status 200': (r) => r.status === 200,
    'service list is array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  });

  if (!serviceCheck) errorRate.add(1);
  apiDuration.add(serviceListRes.timings.duration);
  sleep(0.3);

  const appointmentListRes = http.get(`${BASE_URL}/api/appointment`, {
    tags: { name: 'appointment_list' },
  });

  const appointmentCheck = check(appointmentListRes, {
    'appointment list status 200': (r) => r.status === 200,
    'appointment list is array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  });

  if (!appointmentCheck) errorRate.add(1);
  apiDuration.add(appointmentListRes.timings.duration);
  sleep(0.3);

  const availabilityListRes = http.get(`${BASE_URL}/api/availability`, {
    tags: { name: 'availability_list' },
  });

  const availabilityCheck = check(availabilityListRes, {
    'availability list status 200': (r) => r.status === 200,
    'availability list is array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  });

  if (!availabilityCheck) errorRate.add(1);
  apiDuration.add(availabilityListRes.timings.duration);
  sleep(0.3);

  const documentListRes = http.get(`${BASE_URL}/api/document`, {
    tags: { name: 'document_list' },
  });

  const documentCheck = check(documentListRes, {
    'document list status 200': (r) => r.status === 200,
    'document list is array': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data || body);
      } catch {
        return false;
      }
    },
  });

  if (!documentCheck) errorRate.add(1);
  apiDuration.add(documentListRes.timings.duration);
  sleep(0.3);


  // ==========================================================================
  // 5. Auth Flow (if credentials provided)
  // ==========================================================================
  if (testUser.email && testUser.password) {
    const loginStart = Date.now();

    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'login' },
      }
    );

    loginDuration.add(Date.now() - loginStart);

    const loginSuccess = check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'login has session': (r) => {
        try {
          const body = JSON.parse(r.body as string);
          return body.session !== undefined || body.access_token !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (!loginSuccess) errorRate.add(1);
  }

  sleep(1);
}

// Setup function - runs once before the test
export function setup() {
  console.log(`Running baseline load test against: ${BASE_URL}`);
  console.log('VUs: 10, Duration: 30s');

  // Verify health endpoint is reachable
  const healthRes = http.get(`${BASE_URL}/api/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Health check failed: ${healthRes.status}`);
  }

  return { startTime: Date.now() };
}

// Teardown function - runs once after the test
export function teardown(data: { startTime: number }) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(2)}s`);
}
