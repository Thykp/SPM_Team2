// Mock the entire html module
jest.mock('../../../factory/html', () => ({
  renderHtml: jest.fn()
}));

const { renderHtml } = require('../../../factory/html');

describe('Html', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

  describe('renderHtml', () => {
    const mockTemplateData = {
      userId: 'user123',
      tasks: [
        {
          id: 'task1',
          title: 'Test Task',
          status: 'Completed',
          deadline: '2024-01-15',
          priority: 2,
          projectName: 'Test Project',
          role: 'Owner'
        }
      ],
      kpis: {
        totalTasks: 1,
        completedTasks: 1,
        underReviewTasks: 0,
        ongoingTasks: 0,
        overdueTasks: 0,
        highPriorityTasks: 1,
        mediumPriorityTasks: 0,
        lowPriorityTasks: 0
      },
      reportPeriod: '2024-01-01 - 2024-01-31',
      charts: {
        statusBar: 'data:image/png;base64,mockStatusChart',
        priorityPie: 'data:image/png;base64,mockPriorityChart'
      },
      template_file: 'personalReport.njk'
    };

    test('should render HTML with valid template data', async () => {
      const mockHtml = '<html><body>Mock HTML Content</body></html>';
      renderHtml.mockResolvedValue(mockHtml);

      const result = await renderHtml(mockTemplateData);

      expect(renderHtml).toHaveBeenCalledWith(mockTemplateData);
      expect(result).toBe(mockHtml);
    });

    test('should handle different template files', async () => {
      const mockHtml = '<html><body>Different Template</body></html>';
      renderHtml.mockResolvedValue(mockHtml);

      const customTemplateData = {
        ...mockTemplateData,
        template_file: 'customReport.njk'
      };

      const result = await renderHtml(customTemplateData);

      expect(renderHtml).toHaveBeenCalledWith(customTemplateData);
      expect(result).toBe(mockHtml);
    });

    test('should handle empty tasks array', async () => {
      const mockHtml = '<html><body>Empty Tasks</body></html>';
      renderHtml.mockResolvedValue(mockHtml);

      const emptyTasksData = {
        ...mockTemplateData,
        tasks: []
      };

      const result = await renderHtml(emptyTasksData);

      expect(renderHtml).toHaveBeenCalledWith(emptyTasksData);
      expect(result).toBe(mockHtml);
    });

    test('should handle null or undefined values in data', async () => {
      const mockHtml = '<html><body>Null Values</body></html>';
      renderHtml.mockResolvedValue(mockHtml);

      const dataWithNulls = {
        userId: null,
        tasks: null,
        kpis: null,
        reportPeriod: null,
        charts: null,
        template_file: 'personalReport.njk'
      };

      const result = await renderHtml(dataWithNulls);

      expect(renderHtml).toHaveBeenCalledWith(dataWithNulls);
      expect(result).toBe(mockHtml);
    });

    test('should handle template rendering errors', async () => {
      const templateError = new Error('Template not found');
      renderHtml.mockRejectedValue(templateError);

      await expect(renderHtml(mockTemplateData))
        .rejects
        .toThrow('Template not found');
    });

    test('should handle complex task data structures', async () => {
      const mockHtml = '<html><body>Complex Tasks</body></html>';
      renderHtml.mockResolvedValue(mockHtml);

      const complexTasksData = {
        userId: 'user456',
        tasks: [
          {
            id: 'task1',
            title: 'Complex Task with Special Characters: & < > " \'',
            status: 'Under Review',
            deadline: '2024-12-31',
            priority: 1,
            projectName: 'Project with "Quotes" & Symbols',
            role: 'Collaborator'
          }
        ],
        kpis: { totalTasks: 1 },
        reportPeriod: '2024-01-01 - 2024-12-31',
        charts: { statusBar: 'chart1', priorityPie: 'chart2' },
        template_file: 'personalReport.njk'
      };

      const result = await renderHtml(complexTasksData);

      expect(renderHtml).toHaveBeenCalledWith(complexTasksData);
      expect(result).toBe(mockHtml);
    });

    test('should handle very large datasets', async () => {
      const mockHtml = '<html><body>Large Dataset</body></html>';
      renderHtml.mockResolvedValue(mockHtml);

      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task${i}`,
        title: `Task ${i}`,
        status: 'Ongoing',
        deadline: '2024-01-15',
        priority: Math.floor(Math.random() * 10) + 1,
        projectName: `Project ${i % 10}`,
        role: i % 2 === 0 ? 'Owner' : 'Collaborator'
      }));

      const largeData = {
        userId: 'user123',
        tasks: largeTasks,
        kpis: { totalTasks: 100 },
        reportPeriod: '2024-01-01 - 2024-01-31',
        charts: { statusBar: 'chart1', priorityPie: 'chart2' },
        template_file: 'personalReport.njk'
      };

      const result = await renderHtml(largeData);

      expect(renderHtml).toHaveBeenCalledWith(largeData);
      expect(result).toBe(mockHtml);
    });
  });
});

