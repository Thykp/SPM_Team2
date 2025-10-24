const request = require('supertest');
const app = require('../../app');

describe('GET /user', () => {
  it('returns 200 and health message', async () => {
    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(res.body).toBe('Health Check: Success!');
  });
});
