const express = require('express');
const router = express.Router();
const { publishDeadlineReminder, publishTaskUpdate, publishAddedToResource } = require('../services/publishService');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'manage-notification/publish',
    timestamp: new Date().toISOString(),
  });
});


// Route in notificationRoutes.js
router.post('/deadline-reminder', async (req, res) => {
  try {
    const { taskId, userId, deadline, reminderDays, username } = req.body;

    if (!taskId || !userId || !deadline) {
      return res.status(400).json({ error: 'taskId, userId, and deadline are required' });
    }

    await publishDeadlineReminder({ taskId, userId, deadline,reminderDays, username });

    res.status(200).json({ message: 'Deadline reminders scheduled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// POST /publish/task-update
// Task updates can include multiple collaborators in one payload
router.post('/task-update', async (req, res) => {
  try {
    const { taskId, userIds, status, changedBy } = req.body;
    if (!taskId || !userIds || !status || !changedBy) {
      return res.status(400).json({ error: 'taskId, userIds, status, and changedBy are required' });
    }

    await publishTaskUpdate(taskId, userIds, status, changedBy);

    res.status(200).json({ message: 'Task update notifications sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /publish/added-to-resource
// Added-to-resource notifications can include multiple collaborators in one payload
router.post('/added-to-resource', async (req, res) => {
  try {
    const {resourceType, resourceId, collaboratorIds, resourceName, resourceDescription, addedBy, priority} = req.body;
    if(!resourceType || !resourceId || !collaboratorIds || !resourceName || !resourceDescription || !addedBy) return res.status(400).json({ message: 'missing required fields' });

    await publishAddedToResource(resourceType, resourceId, collaboratorIds, resourceName, resourceDescription, addedBy, priority);

    res.status(200).json({ message: 'Added-to-project notifications sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
