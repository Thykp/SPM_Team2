const { supabase } = require("../db/supabase");

const PROJECT_TABLE = "revamped_project";
const PARTICIPANT_TABLE = "revamped_project_participant";

// Error codes
const ERROR_CODES = {
  NOT_FOUND: "PGRST116",
};

module.exports = {
  // Get all projects
  async getAllProjects() {
    const { data, error } = await supabase
      .from(PROJECT_TABLE)
      .select("*");
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data || [];
  },

  // Get project by ID
  async getProjectById(projectId) {
    const { data, error } = await supabase
      .from(PROJECT_TABLE)
      .select("*")
      .eq("id", projectId)
      .single();
    
    if (error) {
      if (error.code === ERROR_CODES.NOT_FOUND) {
        return null;
      }
      console.error("Error fetching project by ID:", error);
      throw error;
    }
    
    return data;
  },

  // Get project with collaborators
  async getProjectWithCollaborators(projectId) {
    const { data: project, error: projectError } = await supabase
      .from(PROJECT_TABLE)
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      if (projectError.code === ERROR_CODES.NOT_FOUND) {
        return null;
      }
      throw projectError;
    }

    const { data: collaborators, error: collabError } = await supabase
      .from(PARTICIPANT_TABLE)
      .select("profile_id, is_owner, created_at")
      .eq("project_id", projectId);

    if (collabError) {
      console.error("Error fetching collaborators:", collabError);
      throw collabError;
    }

    return {
      ...project,
      collaborators: collaborators || [],
      owner: collaborators?.find(c => c.is_owner)?.profile_id || null,
    };
  },

  // Get projects by user (owner or collaborator)
  async getProjectsByUser(userUuid) {
    const { data: participantProjects, error: participantError } = await supabase
      .from(PARTICIPANT_TABLE)
      .select("project_id")
      .eq("profile_id", userUuid);
    
    if (participantError) {
      throw new Error(participantError.message);
    }

    if (!participantProjects || participantProjects.length === 0) {
      return [];
    }

    const projectIds = participantProjects.map((row) => row.project_id);

    const { data: projects, error: projectError } = await supabase
      .from(PROJECT_TABLE)
      .select("*")
      .in("id", projectIds);
    
    if (projectError) {
      throw new Error(projectError.message);
    }

    return projects || [];
  },

  // Get all collaborators for a project
  async getProjectCollaborators(projectId) {
    const { data, error } = await supabase
      .from(PARTICIPANT_TABLE)
      .select("profile_id, is_owner, created_at")
      .eq("project_id", projectId);
    
    if (error) {
      console.error("Error fetching project collaborators:", error);
      throw error;
    }
    
    return data || [];
  },

  // Add a new project with owner
  async addNewProject(project, ownerId) {
    // Validate input
    if (!ownerId) {
      throw new Error("Owner ID is required");
    }

    const now = new Date().toISOString();

    // Insert project
    const { data, error } = await supabase
      .from(PROJECT_TABLE)
      .insert([{
        title: project.title,
        description: project.description,
        created_at: now,
        updated_at: now,
      }])
      .select()
      .single();

    if (error) {
      console.error("Error inserting project:", error);
      throw error;
    }

    // Add owner to participants table
    const { error: participantError } = await supabase
      .from(PARTICIPANT_TABLE)
      .insert({
        project_id: data.id,
        profile_id: ownerId,
        is_owner: true,
        created_at: now,
      });

    if (participantError) {
      console.error("Error adding owner to participants:", participantError);
      // Rollback: delete the project we just created
      await supabase
        .from(PROJECT_TABLE)
        .delete()
        .eq("id", data.id);
      throw participantError;
    }

    return {
      success: true,
      message: "Project created successfully",
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      timestamp: now,
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

    // Always update the timestamp
    updateFields.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(PROJECT_TABLE)
      .update(updateFields)
      .eq("id", projectId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }

    return {
      success: true,
      message: "Project updated successfully",
      data: data,
      timestamp: new Date().toISOString(),
    };
  },

  // Update collaborators (preserves owner)
  async updateCollaborators(projectId, collaboratorIds) {
    const uniqueCollaborators = Array.from(new Set(collaboratorIds || []));

    // Get the current owner
    const { data: owner, error: ownerError } = await supabase
      .from(PARTICIPANT_TABLE)
      .select("profile_id")
      .eq("project_id", projectId)
      .eq("is_owner", true)
      .single();

    if (ownerError) {
      console.error("Error fetching owner:", ownerError);
      throw ownerError;
    }

    // Delete existing non-owner collaborators only
    const { error: deleteError } = await supabase
      .from(PARTICIPANT_TABLE)
      .delete()
      .eq("project_id", projectId)
      .eq("is_owner", false);

    if (deleteError) {
      console.error("Error deleting existing collaborators:", deleteError);
      throw deleteError;
    }

    // Insert new collaborators (excluding owner)
    const newCollaborators = uniqueCollaborators
      .filter(profileId => profileId !== owner.profile_id)
      .map((profileId) => ({
        project_id: projectId,
        profile_id: profileId,
        is_owner: false,
        created_at: new Date().toISOString(),
      }));

    if (newCollaborators.length > 0) {
      const { error: insertError } = await supabase
        .from(PARTICIPANT_TABLE)
        .insert(newCollaborators);

      if (insertError) {
        console.error("Error inserting new collaborators:", insertError);
        throw insertError;
      }
    }

    return {
      success: true,
      message: "Collaborators updated successfully",
      timestamp: new Date().toISOString(),
    };
  },

  // Change project owner
  async changeProjectOwner(projectId, newOwnerId) {
    // Validate new owner exists in participants
    const { data: existingParticipant, error: checkError } = await supabase
      .from(PARTICIPANT_TABLE)
      .select("profile_id, is_owner")
      .eq("project_id", projectId)
      .eq("profile_id", newOwnerId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking new owner:", checkError);
      throw checkError;
    }

    // Get current owner
    const { data: currentOwner, error: ownerError } = await supabase
      .from(PARTICIPANT_TABLE)
      .select("profile_id")
      .eq("project_id", projectId)
      .eq("is_owner", true)
      .single();

    if (ownerError) {
      console.error("Error fetching current owner:", ownerError);
      throw ownerError;
    }

    // If new owner is already the owner, do nothing
    if (currentOwner.profile_id === newOwnerId) {
      return {
        success: true,
        message: "User is already the project owner",
        timestamp: new Date().toISOString(),
      };
    }

    // Update current owner to regular collaborator
    const { error: demoteError } = await supabase
      .from(PARTICIPANT_TABLE)
      .update({ is_owner: false })
      .eq("project_id", projectId)
      .eq("profile_id", currentOwner.profile_id);

    if (demoteError) {
      console.error("Error demoting current owner:", demoteError);
      throw demoteError;
    }

    // If new owner is not a participant, add them
    if (!existingParticipant) {
      const { error: addError } = await supabase
        .from(PARTICIPANT_TABLE)
        .insert({
          project_id: projectId,
          profile_id: newOwnerId,
          is_owner: true,
          created_at: new Date().toISOString(),
        });

      if (addError) {
        console.error("Error adding new owner:", addError);
        // Rollback: restore previous owner
        await supabase
          .from(PARTICIPANT_TABLE)
          .update({ is_owner: true })
          .eq("project_id", projectId)
          .eq("profile_id", currentOwner.profile_id);
        throw addError;
      }
    } else {
      // Promote existing participant to owner
      const { error: promoteError } = await supabase
        .from(PARTICIPANT_TABLE)
        .update({ is_owner: true })
        .eq("project_id", projectId)
        .eq("profile_id", newOwnerId);

      if (promoteError) {
        console.error("Error promoting new owner:", promoteError);
        // Rollback: restore previous owner
        await supabase
          .from(PARTICIPANT_TABLE)
          .update({ is_owner: true })
          .eq("project_id", projectId)
          .eq("profile_id", currentOwner.profile_id);
        throw promoteError;
      }
    }

    return {
      success: true,
      message: "Project owner changed successfully",
      data: {
        previous_owner: currentOwner.profile_id,
        new_owner: newOwnerId,
      },
      timestamp: new Date().toISOString(),
    };
  },

  // Delete a project
  async deleteProject(projectId) {
    const { error } = await supabase
      .from(PROJECT_TABLE)
      .delete()
      .eq("id", projectId);
    
    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }

    return {
      success: true,
      message: "Project deleted successfully",
      timestamp: new Date().toISOString(),
    };
  },
};