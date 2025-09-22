const request = require('supertest');
const app = require('../../app');

describe('PUT /edit/:taskId', () => {
  it('updates an existing task and returns the updated task', async () => {
    const taskId = '434f5c59-40a7-4678-84a0-2918c932ccf4'; // Replace with a valid task ID from your database
    const updatedTask = {
      title: "Endpoint Test for PUT",
      deadline: "2025-10-15T14:30:00+08:00",
      description: "This task is used for automated testing of the PUT /edit/:taskId endpoint",
      status: "in-progress",
      collaborators: ["c0cd847d-8c61-45dd-8dda-ecffe214943e", "588fb335-9986-4c93-872e-6ef103c97f92"],
      owner: "c0cd847d-8c61-45dd-8dda-ecffe214943e",
      parent: "e8f89b64-84db-4d69-9b19-f21fcc1565a9"
    };

    const res = await request(app)
      .put(`/edit/${taskId}`)
      .send(updatedTask)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
  });
});