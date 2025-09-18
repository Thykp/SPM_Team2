const request = require('supertest');
const app = require('../../app');
const projectModel = require('../../model/project');

jest.mock('../../model/project');

describe('GET /project/user/:uuid - Success Cases', () => {
    const endpoint = '/project/user';
    const testUuid = '11111111-1111-1111-1111-111111111111';
    const ownerProjects = [
        { id: '11111111-1111-1111-1111-111111111111', title: 'Owner Project', owner: testUuid, collaborators: ['22222222-2222-2222-2222-222222222222'] },
    ];
    const collabProjects = [
        { id: '33333333-3333-3333-3333-333333333333', title: 'Collab Project', owner: '44444444-4444-4444-4444-444444444444', collaborators: [testUuid] },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return projects for a valid user uuid', async () => {
        projectModel.getProjectsByOwner.mockResolvedValue([...ownerProjects, ...collabProjects]);
        const res = await request(app).get(`${endpoint}/${testUuid}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(expect.arrayContaining(ownerProjects.concat(collabProjects)));
    });

    it('should return empty array if user has no projects', async () => {
        projectModel.getProjectsByOwner.mockResolvedValue([]);
        const res = await request(app).get(`${endpoint}/no-projects-user`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });
});
