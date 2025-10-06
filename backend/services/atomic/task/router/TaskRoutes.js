const express = require('express');
const router = express.Router();
const taskController = require("../controller/TaskController")

router.get("/health", taskController.taskServiceHealthCheck);


router.get("/", taskController.getAllTasks);
router.post("/", taskController.addTask);
router.get("/:id", taskController.getTaskDetail);
router.put("/:id", taskController.updateTask);
router.delete("/:taskId", taskController.deleteTask);

router.get("/:id/subtasks", taskController.getSubTasks);
router.get("/users/:userId", taskController.getTaskPerUser);
router.post("/users", taskController.getTaskPerUser);

module.exports = router;
