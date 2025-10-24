const express = require('express');
const router = express.Router();
const { getFrequencyPreferences, updateDeliveryPreferences, getDeliveryPreferences, updateFrequencyPreferences } = require('../services/preferencesService');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'manage-notification/preferences',
    timestamp: new Date().toISOString(),
  });

});

// GET /preferences/delivery/:userId
router.get('/delivery/:userId', async (req, res) => {
  try {
    const data = await getDeliveryPreferences(req.params.userId);
    res.json({preferences: data});
  } catch (err) {
    const message = err.response?.data?.error || err.message || 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /preferences/delivery/:userId
router.post('/delivery/:userId', async (req, res) => {
  try {
    const updated = await updateDeliveryPreferences(req.params.userId, req.body);
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /preferences/frequency/:userId
router.get('/frequency/:userId', async (req, res) => {
  try {
    const prefs = await getFrequencyPreferences(req.params.userId);
    res.json(prefs);
  } catch (err) {
    const message = err.response?.data?.error || err.message || 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /preferences/frequency/:userId
router.post('/frequency/:userId', async (req, res) => {
  try {
    const prefs = await updateFrequencyPreferences(req.params.userId, req.body);
    res.json(prefs);
  } catch (err) {
    const message = err.response?.data?.error || err.message || 'Unknown error';
    res.status(500).json({ error: message });
  }
});

module.exports = router;
