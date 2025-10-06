const request = require('supertest');

const app = require('../../app');

describe('Project API - Get All Projects (Integration)', () => {
  test('GET /project/all should return all projects from database', async () => {
    const response = await request(app)
      .get('/project/all');

    console.log('Status:', response.status);
    console.log('Body:', response.body);
    console.log('Error:', response.body.error);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    // If there are projects, verify structure
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('description');
    }
  });
});