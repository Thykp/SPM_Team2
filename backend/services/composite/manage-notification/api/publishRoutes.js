const express = require('express');
const router = express.Router();
const { publishDeadlineReminder, computeNextNotifyAt, publishUpdate, publishAddedToResource } = require('../services/publishService');
const { getFrequencyPreferences } = require('../services/preferencesService')

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'manage-notification/publish',
    timestamp: new Date().toISOString(),
  });
});


// POST /publish/deadline-reminder
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


// POST /publish/update
// Task updates can include multiple collaborators in one payload
router.post('/update', async (req, res) => {
  try {
    // for project-task, currently focusing on change in status
    const { updateType, resourceId, resourceType, resourceContent, collaboratorIds, updatedBy } = req.body;

    if (!updateType || !resourceId || !resourceType || ! resourceContent || ! collaboratorIds || ! updatedBy) {
      return res.status(400).json({ 
        error: 'updateType, resourceId, resourceType, resourceContent, userId, notifyAt, updatedBy are required' 
      });
    }

    await Promise.all(collaboratorIds.map(async (collaboratorId) => {
        const frequency = await getFrequencyPreferences(collaboratorId);
        const notifyAt = computeNextNotifyAt(frequency.data);

        publishUpdate( updateType, resourceId, resourceType, resourceContent, collaboratorId, notifyAt, updatedBy)
      })
    );

    res.status(200).json({ message: 'Resource update notifications scheduled for ' + resourceType });
  } catch (err) {
    console.error("[Update] Error scheduling notifications:", err);
    res.status(500).json({ error: err.message });
  }
});


// POST /publish/added-to-resource
// Added-to-resource notifications can include multiple collaborators in one payload
router.post('/added-to-resource', async (req, res) => {
  try {
    // resourceType = task/project
    const {resourceType, resourceId, collaboratorIds, resourceContent, addedBy} = req.body;
    if(!resourceType || !resourceId || !collaboratorIds || !resourceContent || !addedBy) return res.status(400).json({ message: 'missing required fields: resourceType or resourceId or resourceContent or addedBy' });

    await publishAddedToResource(resourceType, resourceId,  collaboratorIds, resourceContent, addedBy);

    res.status(200).json({ message: 'Added-to-project notifications sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
