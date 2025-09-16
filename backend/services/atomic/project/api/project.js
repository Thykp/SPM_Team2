const express = require('express');
const router = express.Router();
const project = require("../model/project")

router.get("/", async (req, res) => {

    try {

        res.status(200).json('Health Check: Success!');

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

});

router.get("/all", async (req, res) => {

    try {
        
        const allProjects = await project.getAllProjects();

        res.status(200).json(allProjects);

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

});

router.post("/new", async (req, res) => {
    try {
      const newProjData = req.body;
  
      const insertedProj = await project.addNewProj(newProjData);
  
      res.status(201).json(insertedProj);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;
