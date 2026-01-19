/**
 * k6 Spike Load Test
 *
 * Purpose: Test system behavior under sudden traffic spikes.
 * Run: k6 run tests/load/spike.ts
 *
 * Configuration:
 * - Rapid ramp: 1 -> 100 -> 1 VUs
 * - Tests recovery behavior after spike
 * - Monitors error rates during high load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const spikeErrors = new Counter('spike_errors');
const recoveryTime = new Trend('recovery_time');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    // Ramp up quickly to simulate spike
    { duration: '10s', target: 10 },   // Warm up
    { duration: '5s', target: 100 },   // SPIKE: Rapid increase
    { duration: '30s', target: 100 },  // Sustain spike
    { duration: '10s', target: 10 },   // Rapid decrease
    { duration: '15s', target: 10 },   // Recovery period
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    // During spike, we accept higher latency but not failures
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    // Error rate should stay low even during spike
    errors: ['rate<0.01'], // Less than 1% errors
    // Spike-specific error tracking
    spike_errors: ['count<100'],
  },
  tags: {
    testType: 'spike',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const startTime = Date.now();

  // ==========================================================================
  // 1. Health Check - Critical during spike
  // ==========================================================================
  const healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health_check_spike' },
    timeout: '10s', // Longer timeout during spike
  });

  const healthOk = check(healthRes, {
    'health check available': (r) => r.status === 200 || r.status === 503,
    'health check not timeout': (r) => r.status !== 0,
  });

  if (!healthOk) {
    errorRate.add(1);
    spikeErrors.add(1);
  }

  responseTime.add(healthRes.timings.duration);

  sleep(0.2);

  // ==========================================================================
  // 2. Main Application Page
  // ==========================================================================
  const mainRes = http.get(`${BASE_URL}/`, {
    tags: { name: 'main_page_spike' },
    timeout: '15s',
  });

  check(mainRes, {
    'main page available': (r) => r.status === 200,
    'main page responsive': (r) => r.timings.duration < 5000,
  }) || spikeErrors.add(1);

  responseTime.add(mainRes.timings.duration);

  sleep(0.3);

  // ==========================================================================
  // 3. API Endpoints Under Load
  // ==========================================================================
  const profileRes = http.get(`${BASE_URL}/api/profile`, {
    tags: { name: 'profile_spike' },
    timeout: '10s',
  });

  const profileOk = check(profileRes, {
    'profile available during spike': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    'profile not error': (r) => r.status !== 500 && r.status !== 502,
  });

  if (!profileOk) {
    errorRate.add(1);
    spikeErrors.add(1);
  }

  responseTime.add(profileRes.timings.duration);
  sleep(0.2);

  const clientRes = http.get(`${BASE_URL}/api/client`, {
    tags: { name: 'client_spike' },
    timeout: '10s',
  });

  const clientOk = check(clientRes, {
    'client available during spike': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    'client not error': (r) => r.status !== 500 && r.status !== 502,
  });

  if (!clientOk) {
    errorRate.add(1);
    spikeErrors.add(1);
  }

  responseTime.add(clientRes.timings.duration);
  sleep(0.2);

  const serviceRes = http.get(`${BASE_URL}/api/service`, {
    tags: { name: 'service_spike' },
    timeout: '10s',
  });

  const serviceOk = check(serviceRes, {
    'service available during spike': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    'service not error': (r) => r.status !== 500 && r.status !== 502,
  });

  if (!serviceOk) {
    errorRate.add(1);
    spikeErrors.add(1);
  }

  responseTime.add(serviceRes.timings.duration);
  sleep(0.2);

  const appointmentRes = http.get(`${BASE_URL}/api/appointment`, {
    tags: { name: 'appointment_spike' },
    timeout: '10s',
  });

  const appointmentOk = check(appointmentRes, {
    'appointment available during spike': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    'appointment not error': (r) => r.status !== 500 && r.status !== 502,
  });

  if (!appointmentOk) {
    errorRate.add(1);
    spikeErrors.add(1);
  }

  responseTime.add(appointmentRes.timings.duration);
  sleep(0.2);

  const availabilityRes = http.get(`${BASE_URL}/api/availability`, {
    tags: { name: 'availability_spike' },
    timeout: '10s',
  });

  const availabilityOk = check(availabilityRes, {
    'availability available during spike': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    'availability not error': (r) => r.status !== 500 && r.status !== 502,
  });

  if (!availabilityOk) {
    errorRate.add(1);
    spikeErrors.add(1);
  }

  responseTime.add(availabilityRes.timings.duration);
  sleep(0.2);

  const documentRes = http.get(`${BASE_URL}/api/document`, {
    tags: { name: 'document_spike' },
    timeout: '10s',
  });

  const documentOk = check(documentRes, {
    'document available during spike': (r) => r.status === 200 || r.status === 429 || r.status === 503,
    'document not error': (r) => r.status !== 500 && r.status !== 502,
  });

  if (!documentOk) {
    errorRate.add(1);
    spikeErrors.add(1);
  }

  responseTime.add(documentRes.timings.duration);
  sleep(0.2);


  // ==========================================================================
  // 4. Track Recovery Time
  // ==========================================================================
  const endTime = Date.now();
  if (endTime - startTime > 5000) {
    // If iteration took more than 5s, system is under stress
    recoveryTime.add(endTime - startTime);
  }

  // Random sleep to avoid thundering herd
  sleep(Math.random() * 0.5 + 0.1);
}

export function setup() {
  console.log('='.repeat(60));
  console.log('SPIKE TEST');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log('Profile: 10 -> 100 -> 10 VUs over 80s');
  console.log('Purpose: Test system recovery after traffic spike');
  console.log('='.repeat(60));

  // Verify system is healthy before spike
  const healthRes = http.get(`${BASE_URL}/api/health`);
  if (healthRes.status !== 200) {
    throw new Error(`System not healthy before spike test: ${healthRes.status}`);
  }

  return {
    startTime: Date.now(),
    initialHealth: healthRes.status,
  };
}

export function teardown(data: { startTime: number; initialHealth: number }) {
  const duration = (Date.now() - data.startTime) / 1000;

  console.log('='.repeat(60));
  console.log('SPIKE TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration.toFixed(2)}s`);

  // Verify system recovered
  const healthRes = http.get(`${BASE_URL}/api/health`);
  const recovered = healthRes.status === 200;

  console.log(`Recovery status: ${recovered ? 'RECOVERED' : 'DEGRADED'}`);
  console.log('='.repeat(60));

  if (!recovered) {
    console.warn('WARNING: System did not fully recover after spike');
  }
}
