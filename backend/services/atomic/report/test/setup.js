// Jest setup file for report service tests
// This file runs before each test file

// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.GOTENBERG_PATH = 'http://localhost:3001';
process.env.TASK_PATH = 'http://localhost:3031';
process.env.PROJECT_PATH = 'http://localhost:3040';

// Increase timeout for async operations
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create mock task data
  createMockTask: (overrides = {}) => ({
    id: 'task1',
    title: 'Test Task',
    status: 'Completed',
    deadline: '2024-01-15T10:00:00Z',
    priority: 2,
    projectId: 'project1',
    role: 'Owner',
    ...overrides
  }),

  // Helper to create mock project data
  createMockProject: (overrides = {}) => ({
    id: 'project1',
    title: 'Test Project',
    ...overrides
  }),

  // Helper to create mock KPIs
  createMockKPIs: (overrides = {}) => ({
    totalTasks: 1,
    completedTasks: 1,
    underReviewTasks: 0,
    ongoingTasks: 0,
    overdueTasks: 0,
    highPriorityTasks: 1,
    mediumPriorityTasks: 0,
    lowPriorityTasks: 0,
    ...overrides
  })
};

// Suppress console.log during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset console methods
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
});