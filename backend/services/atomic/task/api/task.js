const express = require('express');
const router = express.Router();
const task = require("../model/task")

router.get("/", async (req, res) => {

    try {

        res.status(200).json('Health Check: Success!');

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

});

router.get("/all", async (req, res) => {

    try {
        
        const allTasks = await task.getAllTasks();

        res.status(200).json(allTasks);

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

});

router.post("/new", async (req, res) => {
    try {
      const newTaskData = req.body;
  
      // Call your addNewTask function passing the task details
      const insertedTask = await task.addNewTask(newTaskData);
  
      // Respond with the inserted task
      res.status(201).json(insertedTask);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.get("/:user_id", async (req, res) => {
    try {
        const inputUserId = req.params.user_id;
        const userTasks = await task.getTasksRelatedToUser(inputUserId);

        res.status(200).json(userTasks);
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

module.exports = router;
