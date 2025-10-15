const express = require('express');
const router = express.Router();
const path = require('path');
const aggregateTask = require('../factory/aggregatePersonalTask');
const { fetchTasksForUser } = require('../services/taskService');
const renderPdf = require('../factory/pdf');
const { createReportStorage } = require('../services/reportService');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reports' });
});

// POST /reports/:userId
router.post('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;

    // const { ownerTasks, collaboratorTasks } = await fetchTasksForUser(userId, startDate, endDate);
    // const reportData = aggregateTask.aggregate({ ownerTasks, collaboratorTasks });

    // // Generate PDF and save to disk
    // const pdfPath = await renderPdf({ userId, reportData });
    // res.json({ success: true, pdfPath });
    

    const result = await createReportStorage("D:/github_repos/SPM_Team2/backend/services/atomic/report/reports/d1111111-1111-1111-1111-111111111111-report.pdf");
    res.json({ success: true, data: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;