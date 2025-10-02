const { supabase } = require("../db/supabase");

const PROJECT_TABLE = "revamped_project";
const PARTICIPANT_TABLE = "revamped_project_participant";

module.exports = {

  // Get all projects
  async getAllProjects() {
    const { data, error } = await supabase.from(PROJECT_TABLE).select("*");
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get project by ID
  async getProjectById(projectId) {
    const { data, error } = await supabase.from(PROJECT_TABLE).select("*").eq("id", projectId).single();
    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null;
      }
      console.error("Error fetching project by ID:", error);
      throw error;
    }
    return data;
  },

  // Get projects by owner or collaborator
  async getProjectsByUser(userUuid) {
    // Get projects where user is a participant
    const { data: participantProjects, error: participantError } = await supabase
      .from(PARTICIPANT_TABLE)
      .select("project_id")
      .eq("profile_id", userUuid);
    if (participantError) throw new Error(participantError.message);

    const projectIds = participantProjects.map((row) => row.project_id);

    // Fetch project details
    const { data: projects, error: projectError } = await supabase
      .from(PROJECT_TABLE)
      .select("*")
      .in("id", projectIds);
    if (projectError) throw new Error(projectError.message);

    return projects;
  },

  // Add a new project
  async addNewProject(project) {
    const { data, error } = await supabase.from(PROJECT_TABLE).insert([{
      title: project.title,
      description: project.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }]).select();

    if (error) {
      console.error("Error inserting project:", error);
      throw error;
    }

    console.log("Inserted project:", data);
    const projectData = data && data[0] ? data[0] : data;
    return {
      success: true,
      message: "Project created successfully",
      data: {
            id: projectData.id,
            title: projectData.title,
            description: projectData.description,
       },
      timestamp: new Date().toISOString(),
    };
  },

  // Update project details
  async updateProject(projectId, updateData) {
    const updateFields = {};

    if (updateData.title !== undefined) {
      updateFields.title = updateData.title;
    }

    if (updateData.description !== undefined) {
      updateFields.description = updateData.description;
    }

    if (Object.keys(updateFields).length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const { data, error } = await supabase.from(PROJECT_TABLE).update(updateFields).eq("id", projectId).select().single();
    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }

    console.log("Updated project:", data);
    return {
      success: true,
      message: "Project updated successfully",
      data: data,
      timestamp: new Date().toISOString(),
    };
  },

  // Update collaborators for a project
  async updateCollaborators(projectId, collaboratorIds) {
    const uniqueCollaborators = Array.from(new Set(collaboratorIds || []));

    // Delete existing collaborators
    const { error: deleteError } = await supabase.from(PARTICIPANT_TABLE).delete().eq("project_id", projectId);
    if (deleteError) {
        console.error("Error deleting existing collaborators:", deleteError);
        throw deleteError;
    }

    // Insert new collaborators
    const newCollaborators = uniqueCollaborators.map((profileId) => ({
        project_id: projectId,
        profile_id: profileId,
    }));

    const { data, error: insertError } = await supabase.from(PARTICIPANT_TABLE).insert(newCollaborators);
    if (insertError) {
        console.error("Error inserting new collaborators:", insertError);
        throw insertError;
    }

    console.log("Updated collaborators:", data);
    return {
        success: true,
        message: "Collaborators updated successfully",
        data: data,
        timestamp: new Date().toISOString(),
    };
  },

  // Delete a project
  async deleteProject(projectId) {
    const { data, error } = await supabase.from(PROJECT_TABLE).delete().eq("id", projectId);
    if (error) {
        console.error("Error deleting project:", error);
        throw error;
    }

    console.log("Deleted project:", data);
    return {
        success: true,
        message: "Project deleted successfully",
        data: data,
        timestamp: new Date().toISOString(),
    };
  },

};