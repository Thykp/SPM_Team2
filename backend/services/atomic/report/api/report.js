const express = require('express');
const router = express.Router();
const path = require('path');
const { prepareReportData } = require('../factory/aggregatePersonalTask');
const { fetchTasksForUser } = require('../services/taskService');
const { renderHtml } = require('../factory/html');
const { renderPdf } = require('../factory/pdf');
const { createReportStorage } = require('../services/reportService');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reports' });
});

router.post('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    const taskList = await fetchTasksForUser(userId, startDate, endDate);
    const { tasks, kpis, reportPeriod, charts } = await prepareReportData(taskList, startDate, endDate);

    const html = await renderHtml({ userId, tasks, kpis, reportPeriod, charts });

    const pdfPath = await renderPdf({ userId, html });
    
    // // Upload to Supabase Storage
    const result = await createReportStorage(pdfPath);
    
    res.json({ success: true, pdfPath });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
});

module.exports = router;