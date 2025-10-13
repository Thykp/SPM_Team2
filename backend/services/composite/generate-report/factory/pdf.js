// pdf.js
// Generates a PDF report for a user's tasks using Playwright and an HTML template
const path = require('path');
const fs = require('fs/promises');
const { chromium } = require('playwright');
const renderHtml = require('./html');

const REPORTS_DIR = path.resolve(__dirname, '../reports');

async function renderPdf({ userId, reportData }) {
  // Ensure reports directory exists
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  // Render HTML
  const html = await renderHtml({ userId, reportData });
  const htmlPath = path.join(REPORTS_DIR, `${userId}-report.html`);
  await fs.writeFile(htmlPath, html, 'utf8');

  // Launch Playwright and render PDF
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  const pdfPath = path.join(REPORTS_DIR, `${userId}-report.pdf`);
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  await browser.close();

  return pdfPath;
}

module.exports = renderPdf;
