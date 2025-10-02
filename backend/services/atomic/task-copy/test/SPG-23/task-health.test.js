const request = require('supertest');
const app = require('../../app');

describe('GET /task', () => {
  it('returns 200 and health message', async () => {
    const res = await request(app).get('/task');
    expect(res.status).toBe(200);
    expect(res.body).toBe('Health Check: Success!');
  });
});
