const express = require('express');
const router = express.Router();
const taskController = require("../controller/TaskController")

router.get("/health", taskController.taskServiceHealthCheck);

router.get("/users/:userId", taskController.getTaskPerUser);
router.post("/users", taskController.getTaskPerUser);
router.get("/project/:projectId", taskController.getTasksByProject);
router.get("/:id/subtasks", taskController.getSubTasks);
router.get("/:id/participants", taskController.getTaskParticipants);
router.put("/:id/comment/:userId", taskController.addComment);
router.get("/:id/deadline-reminder/:userId", taskController.getTaskDeadlineReminder);
router.post("/:id/deadline-reminder/:userId", taskController.setTaskDeadlineReminder);
router.get("/:id", taskController.getTaskDetail);
router.put("/:id", taskController.updateTask);
router.delete("/:taskId", taskController.deleteTask);
router.get("/", taskController.getAllTasks);
router.post("/", taskController.addTask);

module.exports = router;
