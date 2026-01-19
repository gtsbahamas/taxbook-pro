/**
 * k6 Stress Load Test
 *
 * Purpose: Find the system's breaking point under progressively increasing load.
 * Run: k6 run tests/load/stress.ts
 *
 * Configuration:
 * - Progressive load increase to breaking point
 * - Entity-specific CRUD load testing
 * - Custom thresholds per endpoint
 *
 * WARNING: This test is designed to stress the system. Run against staging only.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter, Trend, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const breakingPointVUs = new Gauge('breaking_point_vus');
const createLatency = new Trend('create_latency');
const readLatency = new Trend('read_latency');
const updateLatency = new Trend('update_latency');
const deleteLatency = new Trend('delete_latency');
const failedRequests = new Counter('failed_requests');

// Test configuration - progressive stress
export const options = {
  stages: [
    // Gradual ramp to find breaking point
    { duration: '2m', target: 20 },   // Baseline
    { duration: '3m', target: 50 },   // Moderate load
    { duration: '3m', target: 100 },  // High load
    { duration: '3m', target: 150 },  // Stress
    { duration: '3m', target: 200 },  // Breaking point search
    { duration: '2m', target: 0 },    // Recovery
  ],
  thresholds: {
    // Stress test has relaxed thresholds - we're finding limits
    http_req_duration: ['p(95)<5000'],
    errors: ['rate<0.10'], // Up to 10% errors acceptable during stress
    // Per-operation thresholds
    create_latency: ['p(95)<3000'],
    read_latency: ['p(95)<1000'],
    update_latency: ['p(95)<3000'],
    delete_latency: ['p(95)<2000'],
  },
  tags: {
    testType: 'stress',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Auth token storage (set during setup)
let authToken = '';

interface StressTestData {
  startTime: number;
  authToken: string;
}

export function setup(): StressTestData {
  console.log('='.repeat(60));
  console.log('STRESS TEST - FINDING BREAKING POINT');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log('Profile: 20 -> 50 -> 100 -> 150 -> 200 VUs over 16m');
  console.log('WARNING: This test may degrade system performance');
  console.log('='.repeat(60));

  // Authenticate for CRUD operations
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: __ENV.TEST_USER_EMAIL || 'stresstest@example.com',
      password: __ENV.TEST_USER_PASSWORD || 'StressTest123!',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  let token = '';
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body as string);
      token = body.access_token || body.session?.access_token || '';
    } catch {
      console.warn('Could not parse auth response');
    }
  }

  return {
    startTime: Date.now(),
    authToken: token,
  };
}

export default function (data: StressTestData) {
  authToken = data.authToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // ==========================================================================
  // Health Check - Monitor system stability
  // ==========================================================================
  group('health', function () {
    const res = http.get(`${BASE_URL}/api/health`, {
      tags: { name: 'health' },
    });

    const healthy = check(res, {
      'system healthy': (r) => r.status === 200,
    });

    if (!healthy) {
      // Record the VU count when system became unhealthy
      breakingPointVUs.add(__VU);
      errorRate.add(1);
    }
  });

  sleep(0.1);

  // ==========================================================================
  // Profile CRUD Operations
  // ==========================================================================
  group('profile_crud', function () {
    // CREATE
    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/profile`,
      JSON.stringify({
        userId: 'Stress Test 1',
        email: 'Stress Test 2',
        name: 'Stress Test 3',
        firmName: 'Stress Test 4',
        licenseNumber: 'Stress Test 5',
        timezone: 'Stress Test 6',
        subscriptionTier: 'Stress Test 7',
        bookingSlug: 'Stress Test 8',
        taxSeasonStart: 'test',
        taxSeasonEnd: 'test',
        maxDailyAppointments: 11,
        maxDailyAppointmentsTaxSeason: 12,
      }),
      { headers, tags: { name: 'profile_create' } }
    );
    createLatency.add(Date.now() - createStart);

    const created = check(createRes, {
      'profile create success': (r) => r.status === 201 || r.status === 200,
    });

    if (!created) {
      failedRequests.add(1);
      errorRate.add(1);
    }

    let createdId = '';
    if (created) {
      try {
        const body = JSON.parse(createRes.body as string);
        createdId = body.id || body.data?.id || '';
      } catch { /* ignore */ }
    }

    sleep(0.1);

    // READ (List)
    const readStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/profile?limit=10`, {
      headers,
      tags: { name: 'profile_list' },
    });
    readLatency.add(Date.now() - readStart);

    check(listRes, {
      'profile list success': (r) => r.status === 200,
    }) || failedRequests.add(1);

    sleep(0.1);

    // READ (Single) - if we created one
    if (createdId) {
      const readSingleStart = Date.now();
      const singleRes = http.get(`${BASE_URL}/api/profile/${createdId}`, {
        headers,
        tags: { name: 'profile_get' },
      });
      readLatency.add(Date.now() - readSingleStart);

      check(singleRes, {
        'profile get success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // UPDATE
      const updateStart = Date.now();
      const updateRes = http.patch(
        `${BASE_URL}/api/profile/${createdId}`,
        JSON.stringify({
          name: 'Updated Stress Test',
        }),
        { headers, tags: { name: 'profile_update' } }
      );
      updateLatency.add(Date.now() - updateStart);

      check(updateRes, {
        'profile update success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // DELETE (cleanup)
      const deleteStart = Date.now();
      const deleteRes = http.del(`${BASE_URL}/api/profile/${createdId}`, null, {
        headers,
        tags: { name: 'profile_delete' },
      });
      deleteLatency.add(Date.now() - deleteStart);

      check(deleteRes, {
        'profile delete success': (r) => r.status === 200 || r.status === 204,
      }) || failedRequests.add(1);
    }
  });

  sleep(0.2);

  // ==========================================================================
  // Client CRUD Operations
  // ==========================================================================
  group('client_crud', function () {
    // CREATE
    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/client`,
      JSON.stringify({
        userId: 'Stress Test 1',
        name: 'Stress Test 2',
        email: 'Stress Test 3',
        phone: 'Stress Test 4',
        taxIdLast4: 'Stress Test 5',
        filingStatus: 'Stress Test 6',
        preferredContact: 'Stress Test 7',
        notes: 'Stress Test 8',
      }),
      { headers, tags: { name: 'client_create' } }
    );
    createLatency.add(Date.now() - createStart);

    const created = check(createRes, {
      'client create success': (r) => r.status === 201 || r.status === 200,
    });

    if (!created) {
      failedRequests.add(1);
      errorRate.add(1);
    }

    let createdId = '';
    if (created) {
      try {
        const body = JSON.parse(createRes.body as string);
        createdId = body.id || body.data?.id || '';
      } catch { /* ignore */ }
    }

    sleep(0.1);

    // READ (List)
    const readStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/client?limit=10`, {
      headers,
      tags: { name: 'client_list' },
    });
    readLatency.add(Date.now() - readStart);

    check(listRes, {
      'client list success': (r) => r.status === 200,
    }) || failedRequests.add(1);

    sleep(0.1);

    // READ (Single) - if we created one
    if (createdId) {
      const readSingleStart = Date.now();
      const singleRes = http.get(`${BASE_URL}/api/client/${createdId}`, {
        headers,
        tags: { name: 'client_get' },
      });
      readLatency.add(Date.now() - readSingleStart);

      check(singleRes, {
        'client get success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // UPDATE
      const updateStart = Date.now();
      const updateRes = http.patch(
        `${BASE_URL}/api/client/${createdId}`,
        JSON.stringify({
          name: 'Updated Stress Test',
        }),
        { headers, tags: { name: 'client_update' } }
      );
      updateLatency.add(Date.now() - updateStart);

      check(updateRes, {
        'client update success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // DELETE (cleanup)
      const deleteStart = Date.now();
      const deleteRes = http.del(`${BASE_URL}/api/client/${createdId}`, null, {
        headers,
        tags: { name: 'client_delete' },
      });
      deleteLatency.add(Date.now() - deleteStart);

      check(deleteRes, {
        'client delete success': (r) => r.status === 200 || r.status === 204,
      }) || failedRequests.add(1);
    }
  });

  sleep(0.2);

  // ==========================================================================
  // Service CRUD Operations
  // ==========================================================================
  group('service_crud', function () {
    // CREATE
    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/service`,
      JSON.stringify({
        userId: 'Stress Test 1',
        name: 'Stress Test 2',
        description: 'Stress Test 3',
        durationMinutes: 4,
        price: 5,
        taxSeasonOnly: true,
        requiresDocuments: true,
        isActive: true,
        bufferMinutes: 9,
      }),
      { headers, tags: { name: 'service_create' } }
    );
    createLatency.add(Date.now() - createStart);

    const created = check(createRes, {
      'service create success': (r) => r.status === 201 || r.status === 200,
    });

    if (!created) {
      failedRequests.add(1);
      errorRate.add(1);
    }

    let createdId = '';
    if (created) {
      try {
        const body = JSON.parse(createRes.body as string);
        createdId = body.id || body.data?.id || '';
      } catch { /* ignore */ }
    }

    sleep(0.1);

    // READ (List)
    const readStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/service?limit=10`, {
      headers,
      tags: { name: 'service_list' },
    });
    readLatency.add(Date.now() - readStart);

    check(listRes, {
      'service list success': (r) => r.status === 200,
    }) || failedRequests.add(1);

    sleep(0.1);

    // READ (Single) - if we created one
    if (createdId) {
      const readSingleStart = Date.now();
      const singleRes = http.get(`${BASE_URL}/api/service/${createdId}`, {
        headers,
        tags: { name: 'service_get' },
      });
      readLatency.add(Date.now() - readSingleStart);

      check(singleRes, {
        'service get success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // UPDATE
      const updateStart = Date.now();
      const updateRes = http.patch(
        `${BASE_URL}/api/service/${createdId}`,
        JSON.stringify({
          name: 'Updated Stress Test',
        }),
        { headers, tags: { name: 'service_update' } }
      );
      updateLatency.add(Date.now() - updateStart);

      check(updateRes, {
        'service update success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // DELETE (cleanup)
      const deleteStart = Date.now();
      const deleteRes = http.del(`${BASE_URL}/api/service/${createdId}`, null, {
        headers,
        tags: { name: 'service_delete' },
      });
      deleteLatency.add(Date.now() - deleteStart);

      check(deleteRes, {
        'service delete success': (r) => r.status === 200 || r.status === 204,
      }) || failedRequests.add(1);
    }
  });

  sleep(0.2);

  // ==========================================================================
  // Appointment CRUD Operations
  // ==========================================================================
  group('appointment_crud', function () {
    // CREATE
    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/appointment`,
      JSON.stringify({
        userId: 'Stress Test 1',
        clientId: 'Stress Test 2',
        serviceId: 'Stress Test 3',
        startsAt: 'test',
        endsAt: 'test',
        status: 'Stress Test 6',
        notes: 'Stress Test 7',
        meetingLink: 'Stress Test 8',
        reminderSent24h: true,
        reminderSent1h: true,
        cancellationReason: 'Stress Test 11',
      }),
      { headers, tags: { name: 'appointment_create' } }
    );
    createLatency.add(Date.now() - createStart);

    const created = check(createRes, {
      'appointment create success': (r) => r.status === 201 || r.status === 200,
    });

    if (!created) {
      failedRequests.add(1);
      errorRate.add(1);
    }

    let createdId = '';
    if (created) {
      try {
        const body = JSON.parse(createRes.body as string);
        createdId = body.id || body.data?.id || '';
      } catch { /* ignore */ }
    }

    sleep(0.1);

    // READ (List)
    const readStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/appointment?limit=10`, {
      headers,
      tags: { name: 'appointment_list' },
    });
    readLatency.add(Date.now() - readStart);

    check(listRes, {
      'appointment list success': (r) => r.status === 200,
    }) || failedRequests.add(1);

    sleep(0.1);

    // READ (Single) - if we created one
    if (createdId) {
      const readSingleStart = Date.now();
      const singleRes = http.get(`${BASE_URL}/api/appointment/${createdId}`, {
        headers,
        tags: { name: 'appointment_get' },
      });
      readLatency.add(Date.now() - readSingleStart);

      check(singleRes, {
        'appointment get success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // UPDATE
      const updateStart = Date.now();
      const updateRes = http.patch(
        `${BASE_URL}/api/appointment/${createdId}`,
        JSON.stringify({
        }),
        { headers, tags: { name: 'appointment_update' } }
      );
      updateLatency.add(Date.now() - updateStart);

      check(updateRes, {
        'appointment update success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // DELETE (cleanup)
      const deleteStart = Date.now();
      const deleteRes = http.del(`${BASE_URL}/api/appointment/${createdId}`, null, {
        headers,
        tags: { name: 'appointment_delete' },
      });
      deleteLatency.add(Date.now() - deleteStart);

      check(deleteRes, {
        'appointment delete success': (r) => r.status === 200 || r.status === 204,
      }) || failedRequests.add(1);
    }
  });

  sleep(0.2);

  // ==========================================================================
  // Availability CRUD Operations
  // ==========================================================================
  group('availability_crud', function () {
    // CREATE
    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/availability`,
      JSON.stringify({
        userId: 'Stress Test 1',
        dayOfWeek: 2,
        startTime: 'Stress Test 3',
        endTime: 'Stress Test 4',
        isTaxSeason: true,
      }),
      { headers, tags: { name: 'availability_create' } }
    );
    createLatency.add(Date.now() - createStart);

    const created = check(createRes, {
      'availability create success': (r) => r.status === 201 || r.status === 200,
    });

    if (!created) {
      failedRequests.add(1);
      errorRate.add(1);
    }

    let createdId = '';
    if (created) {
      try {
        const body = JSON.parse(createRes.body as string);
        createdId = body.id || body.data?.id || '';
      } catch { /* ignore */ }
    }

    sleep(0.1);

    // READ (List)
    const readStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/availability?limit=10`, {
      headers,
      tags: { name: 'availability_list' },
    });
    readLatency.add(Date.now() - readStart);

    check(listRes, {
      'availability list success': (r) => r.status === 200,
    }) || failedRequests.add(1);

    sleep(0.1);

    // READ (Single) - if we created one
    if (createdId) {
      const readSingleStart = Date.now();
      const singleRes = http.get(`${BASE_URL}/api/availability/${createdId}`, {
        headers,
        tags: { name: 'availability_get' },
      });
      readLatency.add(Date.now() - readSingleStart);

      check(singleRes, {
        'availability get success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // UPDATE
      const updateStart = Date.now();
      const updateRes = http.patch(
        `${BASE_URL}/api/availability/${createdId}`,
        JSON.stringify({
        }),
        { headers, tags: { name: 'availability_update' } }
      );
      updateLatency.add(Date.now() - updateStart);

      check(updateRes, {
        'availability update success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // DELETE (cleanup)
      const deleteStart = Date.now();
      const deleteRes = http.del(`${BASE_URL}/api/availability/${createdId}`, null, {
        headers,
        tags: { name: 'availability_delete' },
      });
      deleteLatency.add(Date.now() - deleteStart);

      check(deleteRes, {
        'availability delete success': (r) => r.status === 200 || r.status === 204,
      }) || failedRequests.add(1);
    }
  });

  sleep(0.2);

  // ==========================================================================
  // Document CRUD Operations
  // ==========================================================================
  group('document_crud', function () {
    // CREATE
    const createStart = Date.now();
    const createRes = http.post(
      `${BASE_URL}/api/document`,
      JSON.stringify({
        userId: 'Stress Test 1',
        clientId: 'Stress Test 2',
        appointmentId: 'Stress Test 3',
        documentType: 'Stress Test 4',
        fileUrl: 'Stress Test 5',
        fileName: 'Stress Test 6',
        status: 'Stress Test 7',
        taxYear: 8,
        notes: 'Stress Test 9',
        rejectionReason: 'Stress Test 10',
      }),
      { headers, tags: { name: 'document_create' } }
    );
    createLatency.add(Date.now() - createStart);

    const created = check(createRes, {
      'document create success': (r) => r.status === 201 || r.status === 200,
    });

    if (!created) {
      failedRequests.add(1);
      errorRate.add(1);
    }

    let createdId = '';
    if (created) {
      try {
        const body = JSON.parse(createRes.body as string);
        createdId = body.id || body.data?.id || '';
      } catch { /* ignore */ }
    }

    sleep(0.1);

    // READ (List)
    const readStart = Date.now();
    const listRes = http.get(`${BASE_URL}/api/document?limit=10`, {
      headers,
      tags: { name: 'document_list' },
    });
    readLatency.add(Date.now() - readStart);

    check(listRes, {
      'document list success': (r) => r.status === 200,
    }) || failedRequests.add(1);

    sleep(0.1);

    // READ (Single) - if we created one
    if (createdId) {
      const readSingleStart = Date.now();
      const singleRes = http.get(`${BASE_URL}/api/document/${createdId}`, {
        headers,
        tags: { name: 'document_get' },
      });
      readLatency.add(Date.now() - readSingleStart);

      check(singleRes, {
        'document get success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // UPDATE
      const updateStart = Date.now();
      const updateRes = http.patch(
        `${BASE_URL}/api/document/${createdId}`,
        JSON.stringify({
        }),
        { headers, tags: { name: 'document_update' } }
      );
      updateLatency.add(Date.now() - updateStart);

      check(updateRes, {
        'document update success': (r) => r.status === 200,
      }) || failedRequests.add(1);

      sleep(0.1);

      // DELETE (cleanup)
      const deleteStart = Date.now();
      const deleteRes = http.del(`${BASE_URL}/api/document/${createdId}`, null, {
        headers,
        tags: { name: 'document_delete' },
      });
      deleteLatency.add(Date.now() - deleteStart);

      check(deleteRes, {
        'document delete success': (r) => r.status === 200 || r.status === 204,
      }) || failedRequests.add(1);
    }
  });

  sleep(0.2);


  // Randomized sleep to avoid synchronized load
  sleep(Math.random() * 0.5);
}

export function teardown(data: StressTestData) {
  const duration = (Date.now() - data.startTime) / 1000;

  console.log('='.repeat(60));
  console.log('STRESS TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total duration: ${(duration / 60).toFixed(2)} minutes`);

  // Check final system health
  const healthRes = http.get(`${BASE_URL}/api/health`);
  const systemHealthy = healthRes.status === 200;

  console.log(`Final system status: ${systemHealthy ? 'HEALTHY' : 'DEGRADED'}`);
  console.log('');
  console.log('Review the following metrics:');
  console.log('- breaking_point_vus: VU count when errors started');
  console.log('- failed_requests: Total failed operations');
  console.log('- *_latency metrics: Operation-specific performance');
  console.log('='.repeat(60));

  if (!systemHealthy) {
    console.error('ALERT: System did not recover after stress test!');
    console.error('Manual intervention may be required.');
  }
}
