const request = require('supertest');
const app = require('../../app');

describe('POST /task/new', () => {
  it('creates a new task and returns it', async () => {
    const newTask = {
      title: "New Task",
      deadline: "2025-09-30",
      description: "This is a test task",
      status: "pending"
    };

    const res = await request(app)
      .post('/task/new')
      .send(newTask)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
  });
});