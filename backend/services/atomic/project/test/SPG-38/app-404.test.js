const request = require('supertest');
const app = require('../../app');

describe('App 404 Error Handling', () => {
  test('GET /nonexistent should return 404', async () => {
    await request(app)
      .get('/nonexistent')
      .expect(404);
  });
});
