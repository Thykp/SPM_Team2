const express = require('express');
const router = express.Router();
const { prepareReportData } = require('../factory/aggregatePersonalTask');
const { fetchTasksForUser } = require('../services/callingService');
const { renderHtml } = require('../factory/html');
const { gotenRenderPdf } = require('../factory/pdf');
const { createReportStorage, createReport } = require('../services/reportService');
const { AppError, ValidationError } = require('../model/AppError');

const isDevelopment = process.env.NODE_ENV !== 'production';

// Helper function for error responses
function sendError(res, statusCode, errorCode, message, details = null, stack = null) {
  const response = {
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  if (isDevelopment && stack) {
    response.error.stack = stack;
  }
  
  return res.status(statusCode).json(response);
}

// Validation helper
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'reports' });
});

router.post('/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { startDate, endDate } = req.body;

  try {
    // Input validation
    if (!userId) {
      return sendError(res, 400, 'MISSING_USER_ID', 'User ID is required');
    }

    if (!startDate || !endDate) {
      return sendError(res, 400, 'MISSING_DATES', 'Both startDate and endDate are required', {
        providedStartDate: startDate,
        providedEndDate: endDate
      });
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return sendError(res, 400, 'INVALID_DATE_FORMAT', 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)', {
        startDate,
        endDate
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return sendError(res, 400, 'INVALID_DATE_RANGE', 'Start date must be before or equal to end date', {
        startDate,
        endDate
      });
    }

    // Fetch tasks and prepare report
    const taskList = await fetchTasksForUser(userId, startDate, endDate);
    const { tasks, kpis, reportPeriod, charts } = await prepareReportData(taskList, startDate, endDate);

    // Render HTML and generate PDF
    const html = await renderHtml({ userId, tasks, kpis, reportPeriod, charts, template_file: 'personalReport.njk' });
    const pdf = await gotenRenderPdf(html);

    // Upload to storage
    const ts = new Date().toISOString();
    const fileName = `${userId}-PersonalTasks-${ts}.pdf`;
    const { publicUrl } = await createReportStorage(pdf, fileName);

    // Save to database
    const formatDate = (dateStr) => new Date(dateStr).toISOString().split('T')[0];
    const reportTitle = `Your Personal report between ${formatDate(startDate)} and ${formatDate(endDate)}`;
    
    await createReport({
      profile_id: userId,
      title: reportTitle
    }, publicUrl);

    // Success response
    res.json({ 
      success: true, 
      data: {
        reportUrl: publicUrl,
        reportTitle,
        taskCount: tasks.length
      }
    });

  } catch (err) {
    // Handle custom errors
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.code, err.message, err.details, err.stack);
    }
    
    // Handle unexpected errors
    return sendError(res, 500, 'UNEXPECTED_ERROR', 'An unexpected error occurred while generating the report', null, err.stack);
  }
});

module.exports = router;