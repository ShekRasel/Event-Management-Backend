const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'local-regression-test-secret';
const { app } = require('../app');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Service = require('../models/Service');
const userId = '507f1f77bcf86cd799439011';
const serviceId = '507f1f77bcf86cd799439012';
let server, base;
before(async () => {
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const token = payload => jwt.sign(payload, process.env.JWT_SECRET);
const auth = payload => ({ authorization: `Bearer ${token(payload)}` });

test('anonymous service deletion is rejected', async () => {
  const response = await fetch(`${base}/api/services/${serviceId}`, { method: 'DELETE' });
  assert.equal(response.status, 401);
});
test('anonymous administrator signup is rejected', async () => {
  const response = await fetch(`${base}/api/admin/signup`, { method: 'POST' });
  assert.equal(response.status, 401);
});
test('malformed bearer header receives one unauthorized response', async () => {
  const response = await fetch(`${base}/api/admin/users`, { headers: { authorization: 'Bearer' } });
  assert.equal(response.status, 401);
});
test('deleted administrators cannot access protected routes', async t => {
  t.mock.method(Admin, 'findById', () => ({ select: async () => null }));
  const response = await fetch(`${base}/api/admin/users`, { headers: auth({ admin: { id: userId } }) });
  assert.equal(response.status, 401);
});
test('database authentication failures return a controlled server error', async t => {
  t.mock.method(User, 'findById', () => ({ select: async () => { throw new Error('private database details'); } }));
  const response = await fetch(`${base}/api/services`, { headers: auth({ id: userId }) });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { message: 'Server error' });
});
test('service deletion is restricted to its owner', async t => {
  t.mock.method(User, 'findById', () => ({ select: async () => ({ _id: userId }) }));
  t.mock.method(Service, 'findOneAndDelete', async query => {
    assert.deepEqual(query, { _id: serviceId, bookedBy: userId });
    return null;
  });
  const response = await fetch(`${base}/api/services/${serviceId}`, { method: 'DELETE', headers: auth({ id: userId }) });
  assert.equal(response.status, 404);
});
test('invalid service IDs return a client error', async t => {
  t.mock.method(User, 'findById', () => ({ select: async () => ({ _id: userId }) }));
  const response = await fetch(`${base}/api/services/invalid`, { method: 'DELETE', headers: auth({ id: userId }) });
  assert.equal(response.status, 400);
});
test('checkout requires authentication', async () => {
  const response = await fetch(`${base}/api/create-checkout-session`, { method: 'POST' });
  assert.equal(response.status, 401);
});
test('checkout cannot pay for another users booking', async t => {
  t.mock.method(User, 'findById', () => ({ select: async () => ({ _id: userId }) }));
  t.mock.method(Service, 'findOne', async query => {
    assert.deepEqual(query, { _id: serviceId, bookedBy: userId });
    return null;
  });
  const response = await fetch(`${base}/api/create-checkout-session`, {
    method: 'POST', headers: { ...auth({ id: userId }), 'content-type': 'application/json' },
    body: JSON.stringify({ serviceId, amount: 1 })
  });
  assert.equal(response.status, 404);
});

test('an owner can delete their booking', async t => {
  t.mock.method(User, 'findById', () => ({ select: async () => ({ _id: userId }) }));
  t.mock.method(Service, 'findOneAndDelete', async () => ({ _id: serviceId }));
  const response = await fetch(`${base}/api/services/${serviceId}`, { method: 'DELETE', headers: auth({ id: userId }) });
  assert.equal(response.status, 200);
});
test('active administrators can access protected routes', async t => {
  t.mock.method(Admin, 'findById', () => ({ select: async () => ({ _id: userId, role: 'admin' }) }));
  t.mock.method(User, 'find', () => ({ select: async () => [] }));
  const response = await fetch(`${base}/api/admin/users`, { headers: auth({ admin: { id: userId } }) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});
