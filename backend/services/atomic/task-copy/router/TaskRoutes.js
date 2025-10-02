const express = require('express');
const router = express.Router();
const task = require("../model/task");
const taskController = require("../controller/TaskController")

router.get("/", taskController.taskServiceHealthCheck);

router.get("/all", taskController.getAllTasks);

router.get("/id/:id", taskController.getTaskDetail);


// TODO
// router.post("/new", taskController.addTask);

router.get("/by-user/:user_id", async (req, res) => {
    try {
        const inputUserId = req.params.user_id;
        const userTasks = await task.getTasksPerUser(inputUserId);

        res.status(200).json(userTasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /task/by-users { ids: ["u1","u2", ...] }
router.post("/by-users", async (req, res) => {
  try {
    const ids = req.body?.ids;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: "ids must be an array" });
    }
    const rows = await task.getTasksByUsers(ids);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/edit/:task_id", async (req, res) => {
    try {
        const taskId = req.params.task_id;
        const updatedTaskData = req.body;

        const updatedTask = await task.updateTask(taskId, updatedTaskData);

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get("/subtask/:parentTaskId", async (req, res) =>{
    try {
        const parentTaskId = req.params.parentTaskId;
        const subTasks = await task.getSubTasksByParent(parentTaskId);

        if (!subTasks) {
        return res.status(404).json({ error: "Sub Task not found" });
        }

        res.status(200).json(subTasks);
    } catch (error) {
        console.error("Error fetching sub tasks:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
