const path = require('path');
const nunjucks = require('nunjucks');

// const TEMPLATE_PATH = path.resolve(__dirname, 'personalReport.njk');

// Configure Nunjucks to look in the current directory
const env = nunjucks.configure('./templates', { autoescape: true });

async function renderHtml({ userId, tasks, kpis, reportPeriod, charts, template_file }) {
  return env.render(template_file, {
    userId,
    tasks,
    kpis,
    reportPeriod,
    charts
  });
}

module.exports = {renderHtml};
