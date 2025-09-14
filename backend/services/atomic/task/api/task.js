const express = require('express');
const router = express.Router();
const user = require("../model/task")

router.get("/", async (req, res) => {

    try {

        res.status(200).json('Health Check: Success!');

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

});

router.get("/all", async (req, res) => {

    try {
        
        const allTasks = await user.getAllTasks();

        res.status(200).json(allTasks);

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

});

router.post("/new", async (req, res) => {
    try {
      const newTaskData = req.body;
  
      // Call your addNewTask function passing the task details
      const insertedTask = await user.addNewTask(newTaskData);
  
      // Respond with the inserted task
      res.status(201).json(insertedTask);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

module.exports = router;
