const request = require('supertest');
const app = require('../../app');

it('returns 404 for unknown route', async () => {
  const res = await request(app).get('/__nope__');
  expect(res.status).toBe(404);
});
