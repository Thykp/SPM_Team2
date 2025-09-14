const request = require('supertest');
const app = require('../../app');

describe('GET /task/all', () => {
  it('returns 200 and a list of tasks', async () => {
    const res = await request(app).get('/task/all');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true); // Ensure the response is an array
  });
});