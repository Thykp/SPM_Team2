const Recurrence = require("../model/Recurrence");

module.exports = {
  async getRecurrenceById(req, res) {
    try {
      const recurrence = await Recurrence.getById(req.params.id);
      res.status(200).json(recurrence);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getRecurrenceByTaskId(req, res) {
    try {
      const recurrences = await Recurrence.getByTaskId(req.params.taskId);
      res.status(200).json(recurrences);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createRecurrence(req, res) {
    try {
      const recurrence = new Recurrence(req.body);
      await recurrence.create();
      res.status(201).json(recurrence);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateRecurrence(req, res) {
    try {
      const recurrence = new Recurrence({ id: req.params.id, ...req.body });
      await recurrence.update();
      res.status(200).json(recurrence);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteRecurrence(req, res) {
    try {
      const recurrence = new Recurrence({ id: req.params.id });
      await recurrence.delete();
      res.status(200).json({ message: "Recurrence deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};