// Mock gotenberg-js-client before importing the module under test
const { pipe, gotenberg, convert, html, please, to, set, a4 } = require('gotenberg-js-client');
jest.mock('gotenberg-js-client');

const { gotenRenderPdf } = require('../../../factory/pdf');

describe('Pdf', () => {
    let mockPipe;
    let mockGotenberg;
    let mockConvert;
    let mockHtml;
    let mockPlease;
    let mockTo;
    let mockSet;
    let mockA4;
    let consoleErrorSpy;

    beforeEach(() => {
        // Create mock functions
        mockPipe = jest.fn();
        mockGotenberg = jest.fn();
        mockConvert = jest.fn();
        mockHtml = jest.fn();
        mockPlease = jest.fn();
        mockTo = jest.fn();
        mockSet = jest.fn();
        mockA4 = jest.fn();

        // Setup mock chain
        mockPipe.mockReturnValue(mockPipe);
        mockGotenberg.mockReturnValue(mockGotenberg);
        mockConvert.mockReturnValue(mockConvert);
        mockHtml.mockReturnValue(mockHtml);
        mockPlease.mockReturnValue(mockPlease);
        mockTo.mockReturnValue(mockTo);
        mockSet.mockReturnValue(mockSet);

        // Mock the module exports
        pipe.mockReturnValue(mockPipe);
        gotenberg.mockReturnValue(mockGotenberg);
        convert.mockReturnValue(mockConvert);
        html.mockReturnValue(mockHtml);
        please.mockReturnValue(mockPlease);
        to.mockReturnValue(mockTo);
        set.mockReturnValue(mockSet);
        a4.mockReturnValue(mockA4);

        jest.clearAllMocks();
        
        // Spy on console.error and suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

  describe('gotenRenderPdf', () => {
    test('should render PDF with default Gotenberg configuration', async () => {
      const mockHtml = '<html><body>Test HTML</body></html>';
      const mockPdfBuffer = Buffer.from('mock-pdf-data');
      
      // Mock the final PDF generation
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(mockHtml);

      // Verify the final call with HTML content
      expect(mockPipe).toHaveBeenCalledWith({
        'index.html': mockHtml
      });

      expect(result).toBe(mockPdfBuffer);
    });

    test('should use custom Gotenberg URL from environment', async () => {
      const originalEnv = process.env.GOTENBERG_PATH;
      process.env.GOTENBERG_PATH = 'http://custom-gotenberg:3001';

      const mockHtml = '<html><body>Custom URL Test</body></html>';
      const mockPdfBuffer = Buffer.from('custom-pdf-data');
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(mockHtml);

      expect(result).toBe(mockPdfBuffer);

      // Restore original environment
      process.env.GOTENBERG_PATH = originalEnv;
    });

    test('should handle complex HTML content', async () => {
      const complexHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Complex Report</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .chart { width: 100%; height: 300px; }
            </style>
          </head>
          <body>
            <h1>Personal Task Report</h1>
            <div class="chart">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Chart">
            </div>
            <table>
              <tr><th>Task</th><th>Status</th></tr>
              <tr><td>Task 1</td><td>Completed</td></tr>
            </table>
          </body>
        </html>
      `;
      
      const mockPdfBuffer = Buffer.from('complex-pdf-data');
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(complexHtml);

      expect(mockPipe).toHaveBeenCalledWith({
        'index.html': complexHtml
      });
      expect(result).toBe(mockPdfBuffer);
    });

    test('should handle empty HTML content', async () => {
      const emptyHtml = '';
      const mockPdfBuffer = Buffer.from('empty-pdf-data');
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(emptyHtml);

      expect(mockPipe).toHaveBeenCalledWith({
        'index.html': emptyHtml
      });
      expect(result).toBe(mockPdfBuffer);
    });

    test('should handle HTML with special characters', async () => {
      const specialCharsHtml = `
        <html>
          <body>
            <h1>Report with Special Characters</h1>
            <p>Quotes: "Hello World"</p>
            <p>Apostrophes: It's working</p>
            <p>Symbols: & < ></p>
            <p>Unicode: 🚀 📊 ✅</p>
          </body>
        </html>
      `;
      
      const mockPdfBuffer = Buffer.from('special-chars-pdf-data');
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(specialCharsHtml);

      expect(mockPipe).toHaveBeenCalledWith({
        'index.html': specialCharsHtml
      });
      expect(result).toBe(mockPdfBuffer);
    });

    test('should handle very large HTML content', async () => {
      const largeHtml = `
        <html>
          <body>
            ${Array.from({ length: 1000 }, (_, i) => 
              `<div>Task ${i}: This is a very long task description that contains a lot of text to test how the PDF generation handles large amounts of content. Task ${i} has priority ${i % 10 + 1} and status ${['Completed', 'Ongoing', 'Under Review', 'Overdue'][i % 4]}.</div>`
            ).join('')}
          </body>
        </html>
      `;
      
      const mockPdfBuffer = Buffer.from('large-html-pdf-data');
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(largeHtml);

      expect(mockPipe).toHaveBeenCalledWith({
        'index.html': largeHtml
      });
      expect(result).toBe(mockPdfBuffer);
    });

    test('should handle Gotenberg service errors', async () => {
      const mockHtml = '<html><body>Error Test</body></html>';
      const gotenbergError = new Error('Gotenberg service unavailable');
      mockPipe.mockRejectedValue(gotenbergError);

      await expect(gotenRenderPdf(mockHtml))
        .rejects
        .toThrow('Gotenberg service unavailable');
    });

    test('should handle PDF generation timeout', async () => {
      const mockHtml = '<html><body>Timeout Test</body></html>';
      const timeoutError = new Error('PDF generation timeout');
      mockPipe.mockRejectedValue(timeoutError);

      await expect(gotenRenderPdf(mockHtml))
        .rejects
        .toThrow('PDF generation timeout');
    });

    test('should handle malformed HTML gracefully', async () => {
      const malformedHtml = `
        <html>
          <head>
            <title>Malformed HTML
          </head>
          <body>
            <h1>Unclosed tag
            <p>Missing closing tag
            <div>Nested <span>tags</div>
          </body>
        </html>
      `;
      
      const mockPdfBuffer = Buffer.from('malformed-html-pdf-data');
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(malformedHtml);

      expect(mockPipe).toHaveBeenCalledWith({
        'index.html': malformedHtml
      });
      expect(result).toBe(mockPdfBuffer);
    });

    test('should handle HTML with embedded images and CSS', async () => {
      const htmlWithAssets = `
        <html>
          <head>
            <style>
              .header { background-color: #f0f0f0; padding: 20px; }
              .chart { border: 1px solid #ccc; margin: 10px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Report with Assets</h1>
            </div>
            <div class="chart">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Status Chart">
            </div>
            <div class="no-print">
              <p>This should not appear in PDF</p>
            </div>
          </body>
        </html>
      `;
      
      const mockPdfBuffer = Buffer.from('html-with-assets-pdf-data');
      mockPipe.mockResolvedValue(mockPdfBuffer);

      const result = await gotenRenderPdf(htmlWithAssets);

      expect(mockPipe).toHaveBeenCalledWith({
        'index.html': htmlWithAssets
      });
      expect(result).toBe(mockPdfBuffer);
    });

    test('should handle concurrent PDF generation requests', async () => {
      const mockHtml1 = '<html><body>Request 1</body></html>';
      const mockHtml2 = '<html><body>Request 2</body></html>';
      const mockPdfBuffer1 = Buffer.from('pdf-1-data');
      const mockPdfBuffer2 = Buffer.from('pdf-2-data');

      // Mock different responses for different calls
      mockPipe
        .mockResolvedValueOnce(mockPdfBuffer1)
        .mockResolvedValueOnce(mockPdfBuffer2);

      const [result1, result2] = await Promise.all([
        gotenRenderPdf(mockHtml1),
        gotenRenderPdf(mockHtml2)
      ]);

      expect(result1).toBe(mockPdfBuffer1);
      expect(result2).toBe(mockPdfBuffer2);
      expect(mockPipe).toHaveBeenCalledTimes(2);
    });
  });
});
