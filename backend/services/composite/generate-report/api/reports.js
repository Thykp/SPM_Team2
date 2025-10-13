const express = require('express');
const router = express.Router();
const path = require('path');
const aggregateTask = require('../factory/aggregateTask');
const { fetchTasksForUser } = require('../services/taskService');
const renderPdf = require('../factory/pdf');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reports' });
});

// POST /reports/:userId
router.post('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // Fetch and aggregate tasks
    const { ownerTasks, collaboratorTasks } = await fetchTasksForUser(userId);
    const reportData = aggregateTask.aggregate({ ownerTasks, collaboratorTasks });
    // Generate PDF and save to disk
    const pdfPath = await renderPdf({ userId, reportData });
    res.json({ success: true, pdfPath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;