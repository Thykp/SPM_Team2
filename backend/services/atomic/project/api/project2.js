const express = require('express');
const router = express.Router();
const project = require("../model/project2");

// Error messages
const ERROR_MESSAGES = {
  MISSING_ID: "Project ID is required",
  MISSING_UUID: "User UUID is required",
  MISSING_TITLE_DESC: "Title and description are required",
  MISSING_OWNER_ID: "Owner ID is required",
  MISSING_UPDATE_DATA: "Update data is required",
  INVALID_COLLABORATORS: "Collaborators must be an array of UUIDs",
  PROJECT_NOT_FOUND: "Project not found",
  NO_COLLABORATORS: "No collaborators found for this project"
};

// ============================================
// Health Check
// ============================================

// Health check
router.get("/", async (req, res) => {
  res.status(200).json({ status: "ok", message: "Project service is running" });
});


// ============================================
// Collection Routes (operate on all projects)
// ============================================

// Get all projects
router.get("/all", async (req, res) => {
  try {
    const allProjects = await project.getAllProjects();
    res.status(200).json(allProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new project
router.post("/", async (req, res) => {
  try {
    const { title, description, ownerId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_TITLE_DESC });
    }

    if (!ownerId) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_OWNER_ID });
    }

    const result = await project.addNewProject({ title, description }, ownerId);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Specific Routes (BEFORE generic /:id)
// ============================================

// Get all projects for a user (owner or collaborator)
router.get("/user/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    
    if (!uuid) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_UUID });
    }

    const projects = await project.getProjectsByUser(uuid);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Individual Project Routes (generic /:id)
// ============================================

// Get project by ID (with collaborators)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_ID });
    }

    const projectData = await project.getProjectWithCollaborators(id);
    
    if (!projectData) {
      return res.status(404).json({ error: ERROR_MESSAGES.PROJECT_NOT_FOUND });
    }

    res.status(200).json(projectData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project details
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_ID });
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_UPDATE_DATA });
    }

    // Check if project exists
    const existingProject = await project.getProjectById(id);
    if (!existingProject) {
      return res.status(404).json({ error: ERROR_MESSAGES.PROJECT_NOT_FOUND });
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
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_ID });
    }

    const deleted = await project.deleteProject(id);

    if (!deleted) {
      return res.status(404).json({ error: ERROR_MESSAGES.PROJECT_NOT_FOUND });
    }

    res.status(200).json(deleted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Sub-resource Routes (/:id/collaborators)
// ============================================

// Get collaborators for a project
router.get("/:id/collaborators", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_ID });
    }

    const collaborators = await project.getProjectCollaborators(id);

    if (!collaborators || collaborators.length === 0) {
      return res.status(404).json({ error: ERROR_MESSAGES.NO_COLLABORATORS });
    }

    res.status(200).json(collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get owner for a project
router.get("/:id/owner", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_ID });
    }

    const owner = await project.getProjectOwner(id);

    if (!owner) {
      return res.status(404).json({ error: ERROR_MESSAGES.MISSING_OWNER_ID });
    }

    res.status(200).json(owner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update collaborators
router.put("/:id/collaborators", async (req, res) => {
  try {
    const { id } = req.params;
    const { collaborators } = req.body;

    if (!id) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_ID });
    }

    if (!Array.isArray(collaborators)) {
      return res.status(400).json({ error: ERROR_MESSAGES.INVALID_COLLABORATORS });
    }

    const updated = await project.updateCollaborators(id, collaborators);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change project owner
router.put("/:id/owner", async (req, res) => {
  try {
    const { id } = req.params;
    const { new_owner_id } = req.body;  

    if (!id) {
      return res.status(400).json({ error: ERROR_MESSAGES.MISSING_ID });
    }

    if (!new_owner_id) {
      return res.status(400).json({ error: "New owner ID is required" });
    }

    const result = await project.changeProjectOwner(id, new_owner_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;