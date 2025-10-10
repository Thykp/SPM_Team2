require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const router = express.Router();

// GET notification preferences
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userMsUrl = process.env.USER_MS_URL || 'http://kong:8000/profile';
    const response = await axios.get(`${userMsUrl}/user/${userId}/notifications/preferences`);
    res.json({ preferences: response.data.notification_delivery });
  } catch (err) {
    console.error('[api:preferences:get]', err.message);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// UPDATE notification preferences
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { preferences } = req.body;

  const allowedPrefs = ['in-app', 'email'];

  // Validate
  if (!Array.isArray(preferences)) {
    return res.status(400).json({ error: 'Preferences must be an array' });
  }

  const invalidPrefs = preferences.filter(p => !allowedPrefs.includes(p));
  if (invalidPrefs.length > 0) {
    return res.status(400).json({ error: `Invalid preferences: ${invalidPrefs.join(', ')}` });
  }

  try {
    const userMsUrl = process.env.USER_MS_URL || 'http://kong:8000/profile';

    // Map frontend "preferences" -> backend "notification_preferences"
    const response = await axios.put(
      `${userMsUrl}/user/${userId}/notifications/preferences`,
      { notification_preferences: preferences }
    );

    res.json({ success: true, preferences: response.data.notification_delivery });
  } catch (err) {
    console.error('[api:preferences:put]', err.message);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
