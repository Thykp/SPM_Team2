const request = require('supertest');
const app = require('../../app');

describe('Project API - Get All Projects', () => {
  test('GET /project/all should return all projects', async () => {
    const response = await request(app)
      .get('/project/all')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
