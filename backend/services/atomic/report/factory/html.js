// html.js
// Renders the HTML for the PDF report using Nunjucks and Tailwind CDN
const path = require('path');
const nunjucks = require('nunjucks');

const TEMPLATE_PATH = path.resolve(__dirname, 'template.njk');

// Configure Nunjucks to look in the current directory
const env = nunjucks.configure(path.dirname(TEMPLATE_PATH), { autoescape: true });

async function renderHtml({ userId, reportData }) {
  // Add timestamp
  const now = new Date();
  const timestamp = now.toLocaleString();
  // Precompute maxVal for bar chart
  const statusList = ["Under Review", "Ongoing", "Completed", "Overdue", "Unassigned"];
  const kpiVals = statusList.map(s => reportData.kpis[s] || 0);
  const maxVal = Math.max(...kpiVals, 1); // avoid divide by zero
  // Render template
  return env.render('template.njk', {
    userId,
    timestamp,
    maxVal,
    ...reportData
  });
}

module.exports = renderHtml;
