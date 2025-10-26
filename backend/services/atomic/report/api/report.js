const express = require('express');
const router = express.Router();
const { prepareReportData } = require('../factory/aggregatePersonalTask');
const { prepareProjectReportData } = require('../factory/aggregateProjectTasks');
const { prepareTeamReportData } = require('../factory/aggregateTeam');
const { prepareDepartmentReportData } = require('../factory/aggregateDepartment');
const { prepareOrganizationReportData } = require('../factory/aggregateOrganization');
const { 
  fetchTasksForUser, 
  fetchProjectWithCollaborators,
  fetchTasksForProject,
  fetchTeamWithMembers,
  fetchTasksForTeam,
  fetchDepartmentWithMembers,
  fetchTasksForDepartment
} = require('../services/callingService');
const { renderHtml } = require('../factory/html');
const { gotenRenderPdf } = require('../factory/pdf');
const { createReportStorage, createReport, getReportsByProfileId, deleteReport } = require('../services/reportService');
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

// Organisation Report Endpoint (MUST be before /:userId to avoid route collision)
router.post('/organisation', async (req, res) => {
  const { startDate, endDate, userId } = req.body;

  try {
    if (!startDate || !endDate) {
      return sendError(res, 400, 'MISSING_DATES', 'Both startDate and endDate are required', {
        providedStartDate: startDate,
        providedEndDate: endDate
      });
    }
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return sendError(res, 400, 'INVALID_DATE_FORMAT', 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)', {
        startDate, endDate
      });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return sendError(res, 400, 'INVALID_DATE_RANGE', 'Start date must be before or equal to end date', {
        startDate, endDate
      });
    }

    if (!userId) {
      return sendError(res, 400, 'MISSING_USER_ID', 'User ID is required in request body');
    }

    // Prepare organization report data
    console.log('Step 1: Preparing organization report data...');
    const reportData = await prepareOrganizationReportData(startDate, endDate);
    console.log('Step 1 complete. Departments:', reportData.departments?.length);

    // Render HTML and generate PDF
    console.log('Step 2: Rendering HTML...');
    const html = await renderHtml({ ...reportData, template_file: 'organizationReport.njk' });
    console.log('Step 2 complete. HTML length:', html?.length);
    
    console.log('Step 3: Generating PDF...');
    const pdf = await gotenRenderPdf(html);
    console.log('Step 3 complete. PDF size:', pdf?.length);
    
    // Upload to storage
    console.log('Step 4: Uploading to storage...');
    const ts = new Date().toISOString();
    const fileName = `OrganizationReport-${ts}.pdf`;
    const { publicUrl } = await createReportStorage(pdf, fileName);
    console.log('Step 4 complete. URL:', publicUrl);
    
    // Save to database
    console.log('Step 5: Saving to database...');
    const formatDate = (dateStr) => new Date(dateStr).toISOString().split('T')[0];
    const reportTitle = `Organization Report between ${formatDate(startDate)} and ${formatDate(endDate)}`;
    await createReport({ profile_id: userId, title: reportTitle }, publicUrl);
    console.log('Step 5 complete.');
    
    // Success response
    res.json({
      success: true,
      data: {
        reportUrl: publicUrl,
        reportTitle,
        departmentCount: reportData.orgKPIs.totalDepartments,
        totalTasks: reportData.orgKPIs.totalTasks,
        employeeCount: reportData.orgKPIs.activeEmployees
      }
    });
  } catch (err) {
    console.error('Organization report error:', err);
    console.error('Error stack:', err.stack);
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.code, err.message, err.details, err.stack);
    }
    return sendError(res, 500, 'UNEXPECTED_ERROR', 'An unexpected error occurred while generating the organization report', { error: err.message }, err.stack);
  }
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

// Project Report Endpoint
router.post('/project/:projectId', async (req, res) => {
  const projectId = req.params.projectId;
  const { startDate, endDate, userId } = req.body;

  try {
    // Input validation
    if (!projectId) {
      return sendError(res, 400, 'MISSING_PROJECT_ID', 'Project ID is required');
    }

    if (!userId) {
      return sendError(res, 400, 'MISSING_USER_ID', 'User ID is required in request body');
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

    // Fetch project with collaborators
    const projectData = await fetchProjectWithCollaborators(projectId);
    
    // Fetch all tasks for the project
    const projectTasks = await fetchTasksForProject(projectId, startDate, endDate);
    
    // Prepare project report data
    const reportData = await prepareProjectReportData(
      projectData, 
      projectTasks, 
      startDate, 
      endDate
    );
    
    console.log('=== Data being passed to template ===');
    console.log('collaborators length:', reportData.collaborators?.length);
    console.log('collaborators sample:', JSON.stringify(reportData.collaborators?.[0], null, 2));
    console.log('unassignedTasks length:', reportData.unassignedTasks?.length);
    console.log('projectKPIs:', reportData.projectKPIs);
    
    // Render HTML and generate PDF
    const html = await renderHtml({
      ...reportData,
      template_file: 'projectReport.njk'
    });
    const pdf = await gotenRenderPdf(html);
    
    // Upload to storage
    const ts = new Date().toISOString();
    const fileName = `${projectId}-ProjectReport-${ts}.pdf`;
    const { publicUrl } = await createReportStorage(pdf, fileName);
    
    // Save to database with requesting user's ID (not project owner)
    const formatDate = (dateStr) => new Date(dateStr).toISOString().split('T')[0];
    const reportTitle = `Project Report: ${reportData.projectTitle} between ${formatDate(startDate)} and ${formatDate(endDate)}`;
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
        collaboratorCount: reportData.collaborators.length,
        taskCount: reportData.totalTasks
      }
    });

  } catch (err) {
    // Handle custom errors
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.code, err.message, err.details, err.stack);
    }
    
    // Handle unexpected errors
    return sendError(res, 500, 'UNEXPECTED_ERROR', 'An unexpected error occurred while generating the project report', null, err.stack);
  }
});

// Team Report Endpoint
router.post('/team/:teamId', async (req, res) => {
  const teamId = req.params.teamId;
  const { startDate, endDate, userId } = req.body;

  try {
    if (!teamId) {
      return sendError(res, 400, 'MISSING_TEAM_ID', 'Team ID is required');
    }
    if (!startDate || !endDate) {
      return sendError(res, 400, 'MISSING_DATES', 'Both startDate and endDate are required', {
        providedStartDate: startDate,
        providedEndDate: endDate
      });
    }
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return sendError(res, 400, 'INVALID_DATE_FORMAT', 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)', {
        startDate, endDate
      });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return sendError(res, 400, 'INVALID_DATE_RANGE', 'Start date must be before or equal to end date', {
        startDate, endDate
      });
    }

    // Fetch team + tasks
    const teamData = await fetchTeamWithMembers(teamId);
    const teamTasks = await fetchTasksForTeam(teamId, startDate, endDate);

    // Prepare report data
    const reportData = await prepareTeamReportData(teamData, teamTasks, startDate, endDate);

    // Render & PDF (reuse project template via aliases)
    const html = await renderHtml({ ...reportData, template_file: 'teamReport.njk' });
    const pdf = await gotenRenderPdf(html);

    // Upload & save
    const ts = new Date().toISOString();
    const fileName = `${teamId}-TeamReport-${ts}.pdf`;
    const { publicUrl } = await createReportStorage(pdf, fileName);

    const formatDate = (dateStr) => new Date(dateStr).toISOString().split('T')[0];
    const reportTitle = `Team Report: ${teamData.name} between ${formatDate(startDate)} and ${formatDate(endDate)}`;
    await createReport({ profile_id: userId, title: reportTitle }, publicUrl);

    res.json({
      success: true,
      data: {
        reportUrl: publicUrl,
        reportTitle,
        memberCount: reportData.members.length,
        taskCount: reportData.totalTasks
      }
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.code, err.message, err.details, err.stack);
    }
    return sendError(res, 500, 'UNEXPECTED_ERROR', 'An unexpected error occurred while generating the team report', null, err.stack);
  }
});

// Department Report Endpoint
router.post('/department/:departmentId', async (req, res) => {
  const departmentId = req.params.departmentId;
  const { startDate, endDate, userId } = req.body;

  try {
    if (!departmentId) {
      return sendError(res, 400, 'MISSING_DEPARTMENT_ID', 'Department ID is required');
    }
    if (!startDate || !endDate) {
      return sendError(res, 400, 'MISSING_DATES', 'Both startDate and endDate are required', {
        providedStartDate: startDate,
        providedEndDate: endDate
      });
    }
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return sendError(res, 400, 'INVALID_DATE_FORMAT', 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)', {
        startDate, endDate
      });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return sendError(res, 400, 'INVALID_DATE_RANGE', 'Start date must be before or equal to end date', {
        startDate, endDate
      });
    }

    // Fetch department + tasks
    const deptData = await fetchDepartmentWithMembers(departmentId);
    const deptTasks = await fetchTasksForDepartment(departmentId, startDate, endDate);

    // Prepare report data
    const reportData = await prepareDepartmentReportData(deptData, deptTasks, startDate, endDate);

    // Render & PDF (reuse project template via aliases)
    const html = await renderHtml({ ...reportData, template_file: 'departmentReport.njk' });
    const pdf = await gotenRenderPdf(html);

    // Upload & save
    const ts = new Date().toISOString();
    const fileName = `${departmentId}-DepartmentReport-${ts}.pdf`;
    const { publicUrl } = await createReportStorage(pdf, fileName);

    const formatDate = (dateStr) => new Date(dateStr).toISOString().split('T')[0];
    const reportTitle = `Department Report: ${deptData.name} between ${formatDate(startDate)} and ${formatDate(endDate)}`;
    await createReport({ profile_id: userId, title: reportTitle }, publicUrl);

    res.json({
      success: true,
      data: {
        reportUrl: publicUrl,
        reportTitle,
        memberCount: reportData.members.length,
        taskCount: reportData.totalTasks
      }
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.code, err.message, err.details, err.stack);
    }
    return sendError(res, 500, 'UNEXPECTED_ERROR', 'An unexpected error occurred while generating the department report', null, err.stack);
  }
});

// GET endpoint to retrieve all reports for a profile
router.get('/profile/:profileId', async (req, res) => {
  const profileId = req.params.profileId;

  try {
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }
    const reports = await getReportsByProfileId(profileId);
    res.status(200).json(reports);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE endpoint to remove a report by ID
router.delete('/:reportId', async (req, res) => {
  const reportId = req.params.reportId;

  try {
    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' });
    }
    await deleteReport(reportId);
    res.status(200).json({ message: 'Successfully deleted report' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;