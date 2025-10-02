const request = require('supertest');
const app = require('../../app');
const projectModel = require('../../model/project2');

jest.mock('../../model/project2');

describe('GET /project/user/:uuid - Error Cases', () => {
    const endpoint = '/project/user';
    const testUuid = '11111111-1111-1111-1111-111111111111';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 404 if uuid is missing', async () => {
        const res = await request(app).get(`${endpoint}/`);
        expect(res.statusCode).toBe(404);
    });

    it('should handle server errors', async () => {
        projectModel.getProjectsByUser.mockRejectedValue(new Error('DB error'));
        const res = await request(app).get(`${endpoint}/${testUuid}`);
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});
