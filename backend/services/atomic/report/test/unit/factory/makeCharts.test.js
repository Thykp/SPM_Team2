const { generateBar, generatePie } = require('../../../factory/makeCharts');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Mock ChartJSNodeCanvas
jest.mock('chartjs-node-canvas');

describe('MakeCharts', () => {
    let mockCanvas;
    let mockRenderToBuffer;
    let consoleErrorSpy;

    beforeEach(() => {
        mockRenderToBuffer = jest.fn();
        mockCanvas = {
            renderToBuffer: mockRenderToBuffer
        };
        ChartJSNodeCanvas.mockImplementation(() => mockCanvas);
        
        jest.clearAllMocks();
        
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

  // Note: barConfig, pieConfig, and renderPng are internal functions
  // We test them indirectly through generateBar and generatePie

  describe('generateBar', () => {
    test('should generate bar chart with correct dimensions and configuration', async () => {
      const mockBuffer = Buffer.from('bar-chart-data');
      mockRenderToBuffer.mockResolvedValue(mockBuffer);

      const labels = ['Completed', 'Ongoing'];
      const values = [5, 3];
      const result = await generateBar(labels, values);

      expect(ChartJSNodeCanvas).toHaveBeenCalledWith({ 
        width: 600, 
        height: 600, 
        backgroundColour: 'white' 
      });
      
      // Verify the renderToBuffer was called with a bar chart config
      expect(mockRenderToBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bar',
          data: expect.objectContaining({
            labels,
            datasets: expect.arrayContaining([
              expect.objectContaining({
                label: 'Tasks',
                data: values
              })
            ])
          })
        })
      );
      expect(result).toBe('data:image/png;base64,YmFyLWNoYXJ0LWRhdGE=');
    });

    test('should handle empty data', async () => {
      const mockBuffer = Buffer.from('empty-chart');
      mockRenderToBuffer.mockResolvedValue(mockBuffer);

      const result = await generateBar([], []);

      expect(result).toBe('data:image/png;base64,ZW1wdHktY2hhcnQ=');
    });

    test('should handle large datasets', async () => {
      const mockBuffer = Buffer.from('large-chart');
      mockRenderToBuffer.mockResolvedValue(mockBuffer);

      const labels = Array.from({ length: 20 }, (_, i) => `Status ${i}`);
      const values = Array.from({ length: 20 }, (_, i) => i + 1);
      
      const result = await generateBar(labels, values);

      expect(result).toBe('data:image/png;base64,bGFyZ2UtY2hhcnQ=');
    });
  });

  describe('generatePie', () => {
    test('should generate pie chart with correct dimensions and configuration', async () => {
      const mockBuffer = Buffer.from('pie-chart-data');
      mockRenderToBuffer.mockResolvedValue(mockBuffer);

      const labels = ['High', 'Medium', 'Low'];
      const values = [3, 2, 1];
      const result = await generatePie(labels, values);

      expect(ChartJSNodeCanvas).toHaveBeenCalledWith({ 
        width: 600, 
        height: 600, 
        backgroundColour: 'white' 
      });
      
      // Verify the renderToBuffer was called with a pie chart config
      expect(mockRenderToBuffer).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'pie',
          data: expect.objectContaining({
            labels,
            datasets: expect.arrayContaining([
              expect.objectContaining({
                data: values
              })
            ])
          })
        })
      );
      expect(result).toBe('data:image/png;base64,cGllLWNoYXJ0LWRhdGE=');
    });

    test('should handle empty data', async () => {
      const mockBuffer = Buffer.from('empty-pie');
      mockRenderToBuffer.mockResolvedValue(mockBuffer);

      const result = await generatePie([], []);

      expect(result).toBe('data:image/png;base64,ZW1wdHktcGll');
    });

    test('should handle single slice pie chart', async () => {
      const mockBuffer = Buffer.from('single-slice');
      mockRenderToBuffer.mockResolvedValue(mockBuffer);

      const result = await generatePie(['All Tasks'], [10]);

      expect(result).toBe('data:image/png;base64,c2luZ2xlLXNsaWNl');
    });

    test('should handle zero values in pie chart', async () => {
      const mockBuffer = Buffer.from('zero-values');
      mockRenderToBuffer.mockResolvedValue(mockBuffer);

      const labels = ['High', 'Medium', 'Low'];
      const values = [5, 0, 0];
      
      const result = await generatePie(labels, values);

      expect(result).toBe('data:image/png;base64,emVyby12YWx1ZXM=');
    });
  });

  // Note: Testing internal configuration functions indirectly through public API
});
