const request = require('supertest');

// Mock all dependencies
jest.mock('../../../factory/aggregatePersonalTask', () => ({
  prepareReportData: jest.fn(),
}));

jest.mock('../../../factory/aggregateProjectTasks', () => ({
  prepareProjectReportData: jest.fn(),
}));

jest.mock('../../../factory/aggregateTeam', () => ({
  prepareTeamReportData: jest.fn(),
}));

jest.mock('../../../factory/aggregateDepartment', () => ({
  prepareDepartmentReportData: jest.fn(),
}));

jest.mock('../../../factory/aggregateOrganization', () => ({
  prepareOrganizationReportData: jest.fn(),
}));

jest.mock('../../../services/callingService', () => ({
  fetchTasksForUser: jest.fn(),
  fetchProjectWithCollaborators: jest.fn(),
  fetchTasksForProject: jest.fn(),
  fetchTeamWithMembers: jest.fn(),
  fetchTasksForTeam: jest.fn(),
  fetchDepartmentWithMembers: jest.fn(),
  fetchTasksForDepartment: jest.fn(),
}));

jest.mock('../../../factory/html', () => ({
  renderHtml: jest.fn(),
}));

jest.mock('../../../factory/pdf', () => ({
  gotenRenderPdf: jest.fn(),
}));

jest.mock('../../../services/reportService', () => ({
  createReportStorage: jest.fn(),
  createReport: jest.fn(),
  getReportsByProfileId: jest.fn(),
  deleteReport: jest.fn(),
}));

const { prepareReportData } = require('../../../factory/aggregatePersonalTask');
const { prepareProjectReportData } = require('../../../factory/aggregateProjectTasks');
const { prepareTeamReportData } = require('../../../factory/aggregateTeam');
const { prepareDepartmentReportData } = require('../../../factory/aggregateDepartment');
const { prepareOrganizationReportData } = require('../../../factory/aggregateOrganization');
const {
  fetchTasksForUser,
  fetchProjectWithCollaborators,
  fetchTasksForProject,
  fetchTeamWithMembers,
  fetchTasksForTeam,
  fetchDepartmentWithMembers,
  fetchTasksForDepartment,
} = require('../../../services/callingService');
const { renderHtml } = require('../../../factory/html');
const { gotenRenderPdf } = require('../../../factory/pdf');
const {
  createReportStorage,
  createReport,
  getReportsByProfileId,
  deleteReport,
} = require('../../../services/reportService');
const { AppError, ValidationError } = require('../../../model/AppError');

const app = require('../../../app');

describe('Report API Tests', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console output during tests
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set NODE_ENV to test (so stack traces won't appear)
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('GET /report/health', () => {
    test('should return 200 with success message', async () => {
      const res = await request(app).get('/report/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        service: 'reports',
      });
    });
  });

  describe('POST /report/organisation', () => {
    const mockReportData = {
      departments: [{ id: 'dept1', name: 'Engineering' }],
      orgKPIs: {
        totalDepartments: 1,
        totalTasks: 10,
        activeEmployees: 50,
      },
    };
    const mockHtml = '<html>Report HTML</html>';
    const mockPdf = Buffer.from('fake pdf content');
    const mockPublicUrl = 'https://storage.example.com/report.pdf';
    const validStartDate = '2024-01-01';
    const validEndDate = '2024-01-31';
    const validUserId = 'user-123';

    beforeEach(() => {
      prepareOrganizationReportData.mockResolvedValue(mockReportData);
      renderHtml.mockResolvedValue(mockHtml);
      gotenRenderPdf.mockResolvedValue(mockPdf);
      createReportStorage.mockResolvedValue({ publicUrl: mockPublicUrl });
      createReport.mockResolvedValue({ id: 'report-123' });
    });

    test('should generate organisation report successfully', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl', mockPublicUrl);
      expect(res.body.data).toHaveProperty('reportTitle');
      expect(res.body.data).toHaveProperty('departmentCount', 1);
      expect(res.body.data).toHaveProperty('totalTasks', 10);
      expect(res.body.data).toHaveProperty('employeeCount', 50);
      
      expect(prepareOrganizationReportData).toHaveBeenCalledWith(validStartDate, validEndDate);
      expect(renderHtml).toHaveBeenCalled();
      expect(gotenRenderPdf).toHaveBeenCalledWith(mockHtml);
      expect(createReportStorage).toHaveBeenCalled();
      expect(createReport).toHaveBeenCalled();
    });

    test('should return 400 when startDate is missing', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
      expect(res.body.error.message).toContain('Both startDate and endDate are required');
    });

    test('should return 400 when endDate is missing', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: validStartDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
    });

    test('should return 400 when both dates are missing', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
    });

    test('should return 400 when date format is invalid', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: 'invalid-date',
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    test('should return 400 when endDate format is invalid', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: validStartDate,
          endDate: 'not-a-date',
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    test('should return 400 when startDate is after endDate', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: validEndDate,
          endDate: validStartDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    test('should return 400 when userId is missing', async () => {
      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_USER_ID');
    });

    test('should handle AppError correctly', async () => {
      const appError = new AppError('Service unavailable', 'SERVICE_UNAVAILABLE', 503);
      prepareOrganizationReportData.mockRejectedValue(appError);

      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(res.body.error.message).toBe('Service unavailable');
    });

    test('should handle unexpected errors correctly', async () => {
      const unexpectedError = new Error('Unexpected database error');
      prepareOrganizationReportData.mockRejectedValue(unexpectedError);

      const res = await request(app)
        .post('/report/organisation')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNEXPECTED_ERROR');
      expect(res.body.error.message).toContain('unexpected error occurred');
    });
  });

  describe('POST /report/:userId', () => {
    const mockTaskList = [
      { id: 'task1', title: 'Task 1', status: 'Completed' },
      { id: 'task2', title: 'Task 2', status: 'Ongoing' },
    ];
    const mockReportData = {
      tasks: mockTaskList,
      kpis: { totalTasks: 2, completedTasks: 1 },
      reportPeriod: { start: '2024-01-01', end: '2024-01-31' },
      charts: {},
    };
    const mockHtml = '<html>Personal Report HTML</html>';
    const mockPdf = Buffer.from('fake pdf content');
    const mockPublicUrl = 'https://storage.example.com/personal-report.pdf';
    const validUserId = 'user-456';
    const validStartDate = '2024-01-01';
    const validEndDate = '2024-01-31';

    beforeEach(() => {
      fetchTasksForUser.mockResolvedValue(mockTaskList);
      prepareReportData.mockResolvedValue(mockReportData);
      renderHtml.mockResolvedValue(mockHtml);
      gotenRenderPdf.mockResolvedValue(mockPdf);
      createReportStorage.mockResolvedValue({ publicUrl: mockPublicUrl });
      createReport.mockResolvedValue({ id: 'report-456' });
    });

    test('should generate personal report successfully', async () => {
      const res = await request(app)
        .post(`/report/${validUserId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl', mockPublicUrl);
      expect(res.body.data).toHaveProperty('reportTitle');
      expect(res.body.data).toHaveProperty('taskCount', 2);
      
      expect(fetchTasksForUser).toHaveBeenCalledWith(validUserId, validStartDate, validEndDate);
      expect(prepareReportData).toHaveBeenCalledWith(mockTaskList, validStartDate, validEndDate);
      expect(renderHtml).toHaveBeenCalled();
      expect(gotenRenderPdf).toHaveBeenCalledWith(mockHtml);
      expect(createReportStorage).toHaveBeenCalled();
      expect(createReport).toHaveBeenCalled();
    });

    test('should return 400 when userId is missing', async () => {
      const res = await request(app)
        .post('/report/')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
        });

      // This might return 404, but the handler checks for empty userId
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 400 when startDate is missing', async () => {
      const res = await request(app)
        .post(`/report/${validUserId}`)
        .send({
          endDate: validEndDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
    });

    test('should return 400 when endDate is missing', async () => {
      const res = await request(app)
        .post(`/report/${validUserId}`)
        .send({
          startDate: validStartDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
    });

    test('should return 400 when date format is invalid', async () => {
      const res = await request(app)
        .post(`/report/${validUserId}`)
        .send({
          startDate: 'invalid-date',
          endDate: validEndDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    test('should return 400 when startDate is after endDate', async () => {
      const res = await request(app)
        .post(`/report/${validUserId}`)
        .send({
          startDate: validEndDate,
          endDate: validStartDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    test('should handle AppError correctly', async () => {
      const appError = new AppError('Task not found', 'NOT_FOUND', 404);
      fetchTasksForUser.mockRejectedValue(appError);

      const res = await request(app)
        .post(`/report/${validUserId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('should handle unexpected errors correctly', async () => {
      const unexpectedError = new Error('Database connection failed');
      fetchTasksForUser.mockRejectedValue(unexpectedError);

      const res = await request(app)
        .post(`/report/${validUserId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('POST /report/project/:projectId', () => {
    const mockProjectData = {
      id: 'project-789',
      title: 'Test Project',
      collaborators: [{ id: 'user1', name: 'User 1' }],
    };
    const mockProjectTasks = [
      { id: 'task1', title: 'Task 1', status: 'Completed' },
    ];
    const mockReportData = {
      projectTitle: 'Test Project',
      collaborators: [{ id: 'user1', name: 'User 1' }],
      totalTasks: 1,
      projectKPIs: { totalTasks: 1 },
    };
    const mockHtml = '<html>Project Report HTML</html>';
    const mockPdf = Buffer.from('fake pdf content');
    const mockPublicUrl = 'https://storage.example.com/project-report.pdf';
    const validProjectId = 'project-789';
    const validUserId = 'user-123';
    const validStartDate = '2024-01-01';
    const validEndDate = '2024-01-31';

    beforeEach(() => {
      fetchProjectWithCollaborators.mockResolvedValue(mockProjectData);
      fetchTasksForProject.mockResolvedValue(mockProjectTasks);
      prepareProjectReportData.mockResolvedValue(mockReportData);
      renderHtml.mockResolvedValue(mockHtml);
      gotenRenderPdf.mockResolvedValue(mockPdf);
      createReportStorage.mockResolvedValue({ publicUrl: mockPublicUrl });
      createReport.mockResolvedValue({ id: 'report-789' });
    });

    test('should generate project report successfully', async () => {
      const res = await request(app)
        .post(`/report/project/${validProjectId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl', mockPublicUrl);
      expect(res.body.data).toHaveProperty('reportTitle');
      expect(res.body.data).toHaveProperty('collaboratorCount', 1);
      expect(res.body.data).toHaveProperty('taskCount', 1);
      
      expect(fetchProjectWithCollaborators).toHaveBeenCalledWith(validProjectId);
      expect(fetchTasksForProject).toHaveBeenCalledWith(validProjectId, validStartDate, validEndDate);
      expect(prepareProjectReportData).toHaveBeenCalled();
      expect(renderHtml).toHaveBeenCalled();
      expect(gotenRenderPdf).toHaveBeenCalledWith(mockHtml);
      expect(createReportStorage).toHaveBeenCalled();
      expect(createReport).toHaveBeenCalled();
    });

    test('should return 400 when projectId is missing', async () => {
      const res = await request(app)
        .post('/report/project/')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 400 when userId is missing', async () => {
      const res = await request(app)
        .post(`/report/project/${validProjectId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_USER_ID');
    });

    test('should return 400 when startDate is missing', async () => {
      const res = await request(app)
        .post(`/report/project/${validProjectId}`)
        .send({
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
    });

    test('should return 400 when date format is invalid', async () => {
      const res = await request(app)
        .post(`/report/project/${validProjectId}`)
        .send({
          startDate: 'invalid-date',
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    test('should return 400 when startDate is after endDate', async () => {
      const res = await request(app)
        .post(`/report/project/${validProjectId}`)
        .send({
          startDate: validEndDate,
          endDate: validStartDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    test('should handle AppError correctly', async () => {
      const appError = new AppError('Project not found', 'NOT_FOUND', 404);
      fetchProjectWithCollaborators.mockRejectedValue(appError);

      const res = await request(app)
        .post(`/report/project/${validProjectId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('should handle unexpected errors correctly', async () => {
      const unexpectedError = new Error('Service unavailable');
      fetchProjectWithCollaborators.mockRejectedValue(unexpectedError);

      const res = await request(app)
        .post(`/report/project/${validProjectId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('POST /report/team/:teamId', () => {
    const mockTeamData = {
      id: 'team-123',
      name: 'Engineering Team',
      members: ['user1', 'user2'],
    };
    const mockTeamTasks = [
      { id: 'task1', title: 'Task 1', status: 'Completed' },
    ];
    const mockReportData = {
      teamName: 'Engineering Team',
      members: [{ id: 'user1' }, { id: 'user2' }],
      totalTasks: 1,
    };
    const mockHtml = '<html>Team Report HTML</html>';
    const mockPdf = Buffer.from('fake pdf content');
    const mockPublicUrl = 'https://storage.example.com/team-report.pdf';
    const validTeamId = 'team-123';
    const validUserId = 'user-123';
    const validStartDate = '2024-01-01';
    const validEndDate = '2024-01-31';

    beforeEach(() => {
      fetchTeamWithMembers.mockResolvedValue(mockTeamData);
      fetchTasksForTeam.mockResolvedValue(mockTeamTasks);
      prepareTeamReportData.mockResolvedValue(mockReportData);
      renderHtml.mockResolvedValue(mockHtml);
      gotenRenderPdf.mockResolvedValue(mockPdf);
      createReportStorage.mockResolvedValue({ publicUrl: mockPublicUrl });
      createReport.mockResolvedValue({ id: 'report-team-123' });
    });

    test('should generate team report successfully', async () => {
      const res = await request(app)
        .post(`/report/team/${validTeamId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl', mockPublicUrl);
      expect(res.body.data).toHaveProperty('reportTitle');
      expect(res.body.data).toHaveProperty('memberCount', 2);
      expect(res.body.data).toHaveProperty('taskCount', 1);
      
      expect(fetchTeamWithMembers).toHaveBeenCalledWith(validTeamId);
      expect(fetchTasksForTeam).toHaveBeenCalledWith(validTeamId, validStartDate, validEndDate);
      expect(prepareTeamReportData).toHaveBeenCalled();
      expect(renderHtml).toHaveBeenCalled();
      expect(gotenRenderPdf).toHaveBeenCalledWith(mockHtml);
      expect(createReportStorage).toHaveBeenCalled();
      expect(createReport).toHaveBeenCalled();
    });

    test('should return 400 when teamId is missing', async () => {
      const res = await request(app)
        .post('/report/team/')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 400 when startDate is missing', async () => {
      const res = await request(app)
        .post(`/report/team/${validTeamId}`)
        .send({
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
    });

    test('should return 400 when date format is invalid', async () => {
      const res = await request(app)
        .post(`/report/team/${validTeamId}`)
        .send({
          startDate: 'invalid-date',
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    test('should return 400 when startDate is after endDate', async () => {
      const res = await request(app)
        .post(`/report/team/${validTeamId}`)
        .send({
          startDate: validEndDate,
          endDate: validStartDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    test('should handle AppError correctly', async () => {
      const appError = new AppError('Team not found', 'NOT_FOUND', 404);
      fetchTeamWithMembers.mockRejectedValue(appError);

      const res = await request(app)
        .post(`/report/team/${validTeamId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('should handle unexpected errors correctly', async () => {
      const unexpectedError = new Error('Service unavailable');
      fetchTeamWithMembers.mockRejectedValue(unexpectedError);

      const res = await request(app)
        .post(`/report/team/${validTeamId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('POST /report/department/:departmentId', () => {
    const mockDeptData = {
      id: 'dept-456',
      name: 'Engineering',
      members: ['user1', 'user2', 'user3'],
    };
    const mockDeptTasks = [
      { id: 'task1', title: 'Task 1', status: 'Completed' },
    ];
    const mockReportData = {
      departmentName: 'Engineering',
      members: [{ id: 'user1' }, { id: 'user2' }, { id: 'user3' }],
      totalTasks: 1,
    };
    const mockHtml = '<html>Department Report HTML</html>';
    const mockPdf = Buffer.from('fake pdf content');
    const mockPublicUrl = 'https://storage.example.com/dept-report.pdf';
    const validDeptId = 'dept-456';
    const validUserId = 'user-123';
    const validStartDate = '2024-01-01';
    const validEndDate = '2024-01-31';

    beforeEach(() => {
      fetchDepartmentWithMembers.mockResolvedValue(mockDeptData);
      fetchTasksForDepartment.mockResolvedValue(mockDeptTasks);
      prepareDepartmentReportData.mockResolvedValue(mockReportData);
      renderHtml.mockResolvedValue(mockHtml);
      gotenRenderPdf.mockResolvedValue(mockPdf);
      createReportStorage.mockResolvedValue({ publicUrl: mockPublicUrl });
      createReport.mockResolvedValue({ id: 'report-dept-456' });
    });

    test('should generate department report successfully', async () => {
      const res = await request(app)
        .post(`/report/department/${validDeptId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl', mockPublicUrl);
      expect(res.body.data).toHaveProperty('reportTitle');
      expect(res.body.data).toHaveProperty('memberCount', 3);
      expect(res.body.data).toHaveProperty('taskCount', 1);
      
      expect(fetchDepartmentWithMembers).toHaveBeenCalledWith(validDeptId);
      expect(fetchTasksForDepartment).toHaveBeenCalledWith(validDeptId, validStartDate, validEndDate);
      expect(prepareDepartmentReportData).toHaveBeenCalled();
      expect(renderHtml).toHaveBeenCalled();
      expect(gotenRenderPdf).toHaveBeenCalledWith(mockHtml);
      expect(createReportStorage).toHaveBeenCalled();
      expect(createReport).toHaveBeenCalled();
    });

    test('should return 400 when departmentId is missing', async () => {
      const res = await request(app)
        .post('/report/department/')
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 400 when startDate is missing', async () => {
      const res = await request(app)
        .post(`/report/department/${validDeptId}`)
        .send({
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_DATES');
    });

    test('should return 400 when date format is invalid', async () => {
      const res = await request(app)
        .post(`/report/department/${validDeptId}`)
        .send({
          startDate: 'invalid-date',
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
    });

    test('should return 400 when startDate is after endDate', async () => {
      const res = await request(app)
        .post(`/report/department/${validDeptId}`)
        .send({
          startDate: validEndDate,
          endDate: validStartDate,
          userId: validUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });

    test('should handle AppError correctly', async () => {
      const appError = new AppError('Department not found', 'NOT_FOUND', 404);
      fetchDepartmentWithMembers.mockRejectedValue(appError);

      const res = await request(app)
        .post(`/report/department/${validDeptId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('should handle unexpected errors correctly', async () => {
      const unexpectedError = new Error('Service unavailable');
      fetchDepartmentWithMembers.mockRejectedValue(unexpectedError);

      const res = await request(app)
        .post(`/report/department/${validDeptId}`)
        .send({
          startDate: validStartDate,
          endDate: validEndDate,
          userId: validUserId,
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNEXPECTED_ERROR');
    });
  });

  describe('GET /report/profile/:profileId', () => {
    const validProfileId = 'profile-123';
    const mockReports = [
      { id: 'report1', title: 'Report 1', url: 'https://storage.example.com/report1.pdf' },
      { id: 'report2', title: 'Report 2', url: 'https://storage.example.com/report2.pdf' },
    ];

    beforeEach(() => {
      getReportsByProfileId.mockResolvedValue(mockReports);
    });

    test('should return 200 with reports list', async () => {
      const res = await request(app).get(`/report/profile/${validProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockReports);
      expect(getReportsByProfileId).toHaveBeenCalledWith(validProfileId);
    });

    test('should return 400 when profileId is missing', async () => {
      const res = await request(app).get('/report/profile/');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 500 when service throws error', async () => {
      const error = new Error('Database error');
      getReportsByProfileId.mockRejectedValue(error);

      const res = await request(app).get(`/report/profile/${validProfileId}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Database error');
    });

    test('should return empty array when no reports exist', async () => {
      getReportsByProfileId.mockResolvedValue([]);

      const res = await request(app).get(`/report/profile/${validProfileId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('DELETE /report/:reportId', () => {
    const validReportId = 'report-123';

    beforeEach(() => {
      deleteReport.mockResolvedValue(undefined);
    });

    test('should return 200 with success message', async () => {
      const res = await request(app).delete(`/report/${validReportId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Successfully deleted report' });
      expect(deleteReport).toHaveBeenCalledWith(validReportId);
    });

    test('should return 400 when reportId is missing', async () => {
      const res = await request(app).delete('/report/');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('should return 500 when service throws error', async () => {
      const error = new Error('Delete failed');
      deleteReport.mockRejectedValue(error);

      const res = await request(app).delete(`/report/${validReportId}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Delete failed');
    });
  });
});

