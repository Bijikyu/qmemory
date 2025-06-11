/**
 * Integration tests for the demo Express application
 * Uses supertest to verify REST endpoints behave as expected.
 */

const request = require('supertest');

let server; // will hold HTTP server instance across tests
let agent; // supertest agent for making requests

beforeAll(async () => { // start demo app once for all tests
  process.env.NODE_ENV = 'test'; // ensure development behavior without demo data
  jest.resetModules(); // clear module cache before mocking
  jest.doMock('../../index', () => { // mock missing HTTP utilities for demo app
    const actual = jest.requireActual('../../index'); // retain existing exports
    return {
      ...actual,
      sendSuccess: (res, msg, data) => res.status(200).json({ message: msg, data, timestamp: new Date().toISOString() }), // simplified success helper for tests
      sendBadRequest: (res, msg) => res.status(400).json({ message: msg, timestamp: new Date().toISOString() }), // simplified 400 helper for validation errors
      logInfo: jest.fn(), // stub logging to keep test output clean
      logError: jest.fn() // stub logging to keep test output clean
    };
  });
  const { app } = require('../../demo-app'); // import app after mocks applied
  server = app.listen(0); // random available port prevents conflicts
  agent = request.agent(server); // reuse agent for all tests
});

afterAll(done => { // close server after all tests complete
  server.close(done); // ensures port is released
});

beforeEach(async () => { // reset demo storage between tests
  await agent.post('/users/clear');
});

describe('Demo App API', () => {
  test('GET / returns API index information', async () => {
    const res = await agent.get('/');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('QMemory Library Demo');
    expect(res.body.endpoints).toBeDefined();
  });
  test('GET /health returns service status', async () => {
    const res = await agent.get('/health');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Service is healthy');
    expect(res.body.data.status).toBe('healthy');
  });

  test('GET /users initially returns empty list', async () => {
    const res = await agent.get('/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('POST /users succeeds with valid data', async () => {
    const res = await agent.post('/users').send({ username: 'alice', email: 'a@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('alice');
    expect(res.body.data.id).toBeDefined();
  });

  test('POST /users fails validation when username missing', async () => {
    const res = await agent.post('/users').send({});
    expect(res.status).toBe(400);
  });

  test('creating a user twice returns 400 with duplicate message', async () => {
    await agent.post('/users').send({ username: 'alice' });
    const res = await agent.post('/users').send({ username: 'alice' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/);
  });

  test('GET /users/:id succeeds for existing user', async () => {
    const createRes = await agent.post('/users').send({ username: 'bob' });
    const id = createRes.body.data.id;
    const res = await agent.get(`/users/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('bob');
  });

  test('GET /users/:id returns 404 when not found', async () => {
    const res = await agent.get('/users/9999');
    expect(res.status).toBe(404);
  });

  test('DELETE /users/:id succeeds for existing user', async () => {
    const createRes = await agent.post('/users').send({ username: 'carol' });
    const id = createRes.body.data.id;
    const res = await agent.delete(`/users/${id}`);
    expect(res.status).toBe(200);
  });

  test('DELETE /users/:id returns 404 when missing', async () => {
    const res = await agent.delete('/users/9999');
    expect(res.status).toBe(404);
  });

  test('POST /users/clear resets storage when not in production', async () => {
    await agent.post('/users').send({ username: 'dave' });
    const res = await agent.post('/users/clear');
    expect(res.status).toBe(200);
    const list = await agent.get('/users');
    expect(list.body.data).toEqual([]);
  });

  test('/users/clear responds 400 in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await agent.post('/users/clear');
    expect(res.status).toBe(400);
    process.env.NODE_ENV = 'test';
  });
});
