const express = require('express');
const router = express.Router();
const project = require("../model/project2")

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
        const projects = await project.getProjectsByUser(uuid);
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/new", async (req, res) => {
    try {
      const newProjData = req.body;
  
      // Validate input
      if (!newProjData.title || !newProjData.description) {
        return res.status(400).json({ error: "Title and description are required" });
      }

      const result = await project.addNewProject(newProjData);
  
      res.status(201).json(result);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.put("/:id/collaborators", async (req, res) => {
    try {
      const { id } = req.params;
      const { collaborators } = req.body || {};
      if (!Array.isArray(collaborators)) {
        return res.status(400).json({ error: "Collaborators must be an array of UUIDs" });
      }
      const updated = await project.updateCollaborators(id, collaborators);
      res.status(200).json({ success: true, message: "Collaborators updated successfully", project: updated });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Get project by ID
router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const projectData = await project.getProjectById(id);
      
      if (!projectData) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.status(200).json(projectData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Update project
router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      // Check if project exists
      const existingProject = await project.getProjectById(id);
      if (!existingProject) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Validate input data
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "Update data is required" });
      }

      // Validate collaborators if provided
      if (updateData.collaborators && !Array.isArray(updateData.collaborators)) {
        return res.status(400).json({ error: "collaborators must be an array of UUIDs" });
      }

      // Validate tasklist if provided
      if ((updateData.tasklist || updateData.task_list || updateData.taskList) && 
          !Array.isArray(updateData.tasklist || updateData.task_list || updateData.taskList)) {
        return res.status(400).json({ error: "tasklist must be an array of task IDs" });
      }

      const result = await project.updateProject(id, updateData);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Delete a project
router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const deleted = await project.deleteProject(id);

      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.status(200).json(deleted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

module.exports = router;
