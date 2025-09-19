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

// Get all projects for a user (owner or collaborator)
router.get("/user/:uuid", async (req, res) => {
    const { uuid } = req.params;
    if (!uuid) {
        return res.status(400).json({ error: "Missing user UUID" });
    }
    try {
        const projects = await project.getProjectsByOwner(uuid);
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
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

router.put("/:id/collaborators", async (req, res) => {
    try {
      const { id } = req.params;
      const { collaborators } = req.body || {};
      if (!Array.isArray(collaborators)) {
        return res.status(400).json({ error: "collaborators must be an array of UUIDs" });
      }
      const updated = await project.updateCollaborators(id, collaborators);
      res.status(200).json({ success: true, project: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });  

module.exports = router;
