const request = require('supertest');
const app = require('../../app');
const { supabase } = require('../../db/supabase');

describe('GET /task/:user_id', () => {
  const reqUserId = '588fb335-9986-4c93-872e-6ef103c97f92';

  test('should retreive tasks related to user', async () => {

    supabase.__setNextResults?.([
      {
        data: [{
          id: 't1',
          user_id: reqUserId,
          title: 'Owner Task',
          status: 'open',
          collaborators: [],
          created_at: '2025-01-01T00:00:00.000Z',
        }],
        error: null,
      },
      {
        data: [],
        error: null,
      },
    ]);

    const res = await request(app)
      .get(`/task/by-user/${reqUserId}`)
      .expect('Content-Type', 'application/json; charset=utf-8');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toMatchObject({ id: 't1', user_id: reqUserId });
  });
});
