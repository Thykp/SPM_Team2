const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const BAR_W = 600;
const BAR_H = 600;

const PIE_W = 600;
const PIE_H = 600;

function barConfig(labels, values) {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tasks',
        data: values,
        backgroundColor: [
          '#059669', // Completed - green
          '#2563eb', // Ongoing - blue
          '#d97706', // Under Review - amber
          '#dc2626'  // Overdue - red
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { 
          grid: { display: false },
          ticks: { font: { size: 20 } }
        }
      }
    }
  };
}

function pieConfig(labels, values) {
  return {
    type: 'pie',
    data: { 
      labels, 
      datasets: [{ 
        data: values,
        backgroundColor: [
          '#dc2626', // High - red
          '#f59e0b', // Medium - amber
          '#10b981'  // Low - green
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }] 
    },
    options: { 
      responsive: false, 
      animation: false, 
      plugins: { 
        legend: { 
          display: true, 
          position: 'bottom',
          labels: { padding: 10, font: { size: 20 } }
        } 
      } 
    }
  };
}

async function renderPng(config, width, height) {
  const canvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
  const buf = await canvas.renderToBuffer(config);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function generateBar(labels, values) {
  return renderPng(barConfig(labels, values), BAR_W, BAR_H);
}

async function generatePie(labels, values) {
  return renderPng(pieConfig(labels, values), PIE_W, PIE_H);
}

module.exports = { generateBar, generatePie };