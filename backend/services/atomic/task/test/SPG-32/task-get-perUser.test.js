const request = require('supertest');
const app = require('../../app');


describe("GET /task/:user_id", () => {
    const reqUserId = "588fb335-9986-4c93-872e-6ef103c97f92";

    test("should retreive tasks related to user", async () => {
        const res = await request(app)
            .get(`/task/by-user/${reqUserId}`)
            .expect('Content-Type', 'application/json; charset=utf-8');
        
        expect(res.status).toBe(200);
        console.log(res.body)
    });
})