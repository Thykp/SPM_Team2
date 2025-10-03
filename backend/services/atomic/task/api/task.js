const express = require("express");
const router = express.Router();
const task = require("../model/task");

// Health
router.get("/", async (_req, res) => {
  try {
    res.status(200).json("Health Check: Success!");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All
router.get("/all", async (_req, res) => {
  try {
    const rows = await task.getAllTasks();
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create (revamped): expects { title, deadline, description, status, project_id, parent_task_id?, owner?, collaborators?[] }
router.post("/new", async (req, res) => {
  try {
    const inserted = await task.addNewTask(req.body || {});
    res.status(201).json(inserted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single user → participant join
router.get("/by-user/:user_id", async (req, res) => {
  try {
    const uid = req.params.user_id;
    const rows = await task.getTasksByUsers([uid]);
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Batch users → participant join
router.post("/by-users", async (req, res) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be an array" });
    const rows = await task.getTasksByUsers(ids);
    res.status(200).json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update (revamped) + optional participants replacement
router.put("/edit/:task_id", async (req, res) => {
  try {
    const taskId = req.params.task_id;
    const updated = await task.updateTask(taskId, req.body || {});
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating task:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// By ID
router.get("/id/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const row = await task.getTaskById(taskId);
    if (!row) return res.status(404).json({ error: "Task not found" });
    res.status(200).json(row);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Subtasks
router.get("/subtask/:parentTaskId", async (req, res) => {
  try {
    const parentTaskId = req.params.parentTaskId;
    const rows = await task.getSubTasksByParent(parentTaskId);
    if (!rows) return res.status(404).json({ error: "Sub Task not found" });
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching sub tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
