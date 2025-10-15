const path = require('path');
const fs = require('fs/promises');
const { chromium } = require('playwright');

const REPORTS_DIR = path.resolve(__dirname, '../generated-reports');

async function renderPdf({ userId, html }) {
  // Ensure reports directory exists
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  // Launch Playwright and render PDF
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  
  
  const pdfPath = path.join(REPORTS_DIR, `${userId}-report.pdf`);
  await page.pdf({ 
    path: pdfPath, 
    format: 'A4', 
    printBackground: true,
    // margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
  });
  
  await browser.close();

  return pdfPath;
}

module.exports = {renderPdf};
