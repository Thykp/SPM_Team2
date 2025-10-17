const path = require('path');
const nunjucks = require('nunjucks');

const TEMPLATE_PATH = path.resolve(__dirname, 'personalReport.njk');

// Configure Nunjucks to look in the current directory
const env = nunjucks.configure(path.dirname(TEMPLATE_PATH), { autoescape: true });

async function renderHtml({ userId, tasks, kpis, reportPeriod, charts }) {
  // Render template with pre-processed data and chart images
  return env.render('personalReport.njk', {
    userId,
    tasks,
    kpis,
    reportPeriod,
    charts
  });
}

module.exports = {renderHtml};
