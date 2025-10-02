const request = require('supertest');
const app = require('../../app');
const projectModel = require('../../model/project2');

jest.mock('../../model/project2');

describe('GET /project/user/:uuid - Success Cases', () => {
    const endpoint = '/project/user';
    const testUuid = '11111111-1111-1111-1111-111111111111';
    const userProjects = [
        { id: '11111111-1111-1111-1111-111111111111', title: 'Owner Project', display_name: 'Owner Display Name', description: 'Owner Description' },
        { id: '33333333-3333-3333-3333-333333333333', title: 'Collab Project', display_name: 'Collab Display Name', description: 'Collab Description' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return projects for a valid user uuid', async () => {
        projectModel.getProjectsByUser.mockResolvedValue(userProjects);
        const res = await request(app).get(`${endpoint}/${testUuid}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(expect.arrayContaining(userProjects));
    });

    it('should return empty array if user has no projects', async () => {
        projectModel.getProjectsByUser.mockResolvedValue([]);
        const res = await request(app).get(`${endpoint}/no-projects-user`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });
});
