const express = require('express');
const router = express.Router();
const { scheduleNotification } = require('../model/notifications');

router.post('/', async (req, res) => {
  const { notification, sendAt } = req.body;

  if (!notification || !notification.to_user || !sendAt)
    return res.status(400).json({ error: 'Missing required fields: notification, to_user, sendAt' });

  try {
    await scheduleNotification(notification, sendAt);
    res.json({ scheduled: true, notification, sendAt });
  } catch (err) {
    console.error('[api:schedule:post]', err.message);
    res.status(500).json({ error: 'Failed to schedule notification' });
  }
});

module.exports = router;
