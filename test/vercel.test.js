const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.VERCEL = '1';
const app = require('../app');
const mongoose = require('mongoose');
let server, base;
before(async () => {
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('Vercel receives a callable handler and root works without database credentials', async t => {
  assert.equal(typeof app, 'function');
  const uri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  t.after(() => { if (uri !== undefined) process.env.MONGODB_URI = uri; });
  assert.equal((await fetch(base)).status, 200);
  const response = await fetch(`${base}/api/services`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    message: 'Database unavailable. Check server configuration.',
    reason: 'missing_environment_variables',
    missing: ['MONGODB_URI'],
    action: 'Add the missing variables to the Vercel Production environment, then redeploy.'
  });
});
test('serverless requests share a connection attempt and retry after failure', async t => {
  process.env.MONGODB_URI = 'mongodb://example.invalid/test';
  process.env.JWT_SECRET = 'test-only-secret';
  let count = 0;
  t.mock.method(mongoose, 'connect', async () => {
    count++;
    await new Promise(resolve => setTimeout(resolve, 100));
    if (count === 1) throw new Error('Connection failed');
    return mongoose;
  });
  const responses = await Promise.all([fetch(`${base}/api/unknown`), fetch(`${base}/api/unknown`)]);
  assert.deepEqual(responses.map(r => r.status), [503, 503]);
  assert.equal(count, 1);
  assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
  assert.equal(count, 2);
});
