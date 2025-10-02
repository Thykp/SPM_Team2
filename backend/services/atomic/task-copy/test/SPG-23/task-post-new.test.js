const request = require('supertest');
const app = require('../../app');

describe('POST /task/new', () => {
  it('creates a new task and returns it', async () => {
    const newTask = {
      title: "New Task",
      deadline: "2025-09-30",
      description: "This is a test task",
      status: "pending",
      collaborators: ["588fb335-9986-4c93-872e-6ef103c97f92", "c0cd847d-8c61-45dd-8dda-ecffe214943e"],
      owner: "c0cd847d-8c61-45dd-8dda-ecffe214943e",
      parent: "e8f89b64-84db-4d69-9b19-f21fcc1565a9"
    };

    const res = await request(app)
      .post('/task/new')
      .send(newTask)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
  });
});