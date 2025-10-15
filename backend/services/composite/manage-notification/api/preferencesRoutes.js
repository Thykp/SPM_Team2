const express = require('express');
const router = express.Router();
const { getPreferences, updatePreferences } = require('../services/preferencesService');

// GET /preferences/:userId
router.get('/:userId', async (req, res) => {
  try {
    const prefs = await getPreferences(req.params.userId);
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /preferences/:userId
router.post('/:userId', async (req, res) => {
  try {
    const updated = await updatePreferences(req.params.userId, req.body);
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
