const request = require('supertest');
const app = require('../../app');

describe('Project Health Check', () => {
  test('GET /project/ should return health check message', async () => {
    const response = await request(app)
      .get('/project/')
      .expect(200);

    expect(response.body).toBe('Health Check: Success!');
  });
});
