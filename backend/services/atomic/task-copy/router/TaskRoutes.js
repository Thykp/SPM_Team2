const express = require('express');
const router = express.Router();
const task = require("../model/task");
const taskController = require("../controller/TaskController")

router.get("/", taskController.taskServiceHealthCheck);

router.get("/all", taskController.getAllTasks);

router.get("/id/:id", taskController.getTaskDetail);

router.get("/subtask/:parentTaskId", taskController.getSubTasks);

router.get("/by-user/:userId", taskController.getTaskPerUser);

router.post("/new", taskController.addTask);

router.post("/by-users", taskController.getTaskPerUser);

router.put("/edit/:taskId", taskController.updateTask);

// router.put("/edit/:task_id", async (req, res) => {
//     try {
//         const taskId = req.params.task_id;
//         const updatedTaskData = req.body;

//         const updatedTask = await task.updateTask(taskId, updatedTaskData);

//         res.status(200).json(updatedTask);
//     } catch (error) {
//         console.error("Error updating task:", error.message);
//         res.status(500).json({ error: error.message });
//     }
// });



module.exports = router;
