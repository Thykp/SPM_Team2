const express = require('express');
const router = express.Router();
const task = require("../model/task");
const taskController = require("../controller/TaskController")

router.get("/", taskController.taskServiceHealthCheck);

router.post("/new", taskController.addTask);

router.post("/by-users", taskController.getTaskPerUser);

router.get("/all", taskController.getAllTasks);

router.get("/id/:id", taskController.getTaskDetail);

router.get("/subtask/:parentTaskId", taskController.getSubTasks);

router.get("/by-user/:userId", taskController.getTaskPerUser);

router.put("/edit/:taskId", taskController.updateTask);

router.delete("/delete/:taskId", taskController.deleteTask)



module.exports = router;
