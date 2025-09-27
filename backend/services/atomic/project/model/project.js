const { supabase } = require("../db/supabase");
const projectTable = "project";

module.exports = {

    async getAllProjects() {
        const { data, error } = await supabase
            .from(projectTable)
            .select('*')

        if (error) throw new Error(error.message);
        return data || [];
    },

    async getProjectById(projectId) {
        const { data, error } = await supabase
          .from(projectTable)
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows found
            return null;
          }
          console.error("Error fetching project by ID:", error);
          throw error;
        }

        return data;
    },

  async getProjectsByOwner(userUuid) {
    // Get projects where user is owner
    const { data: ownerProjects, error: ownerError } = await supabase
      .from(projectTable)
      .select('*')
      .eq('owner', userUuid);
    if (ownerError) throw new Error(ownerError.message);

    // Get projects where user is a collaborator
    const { data: collabProjects, error: collabError } = await supabase
      .from(projectTable)
      .select('*')
      .contains('collaborators', [userUuid]);
    if (collabError) throw new Error(collabError.message);

    const allProjects = [...ownerProjects, ...collabProjects];
    const uniqueProjects = Object.values(
      allProjects.reduce((acc, project) => {
        acc[project.id] = project;
        return acc;
      }, {})
    );
    return uniqueProjects;
  },

    async addNewProj(project) {
        const { data, error } = await supabase
          .from(projectTable)
          .insert([{
            title: project.title,
            description: project.description,
            collaborators: project.collaborators,
            owner: project.owner,
            tasklist: project.tasklist || project.task_list || project.taskList
          }])
          .select();
      
        if (error) {
          console.error("Error inserting project:", error);
          throw error;
        }
      
        console.log("Inserted project:", data);
        // Return the first project from the array
        return data && data[0] ? data[0] : data;
    },

    async updateProject(projectId, updateData) {
        // Build update object with only provided fields
        const updateFields = {};
        
        if (updateData.title !== undefined) {
          updateFields.title = updateData.title;
        }
        if (updateData.description !== undefined) {
          updateFields.description = updateData.description;
        }
        if (updateData.collaborators !== undefined) {
          updateFields.collaborators = updateData.collaborators;
        }
        if (updateData.owner !== undefined) {
          updateFields.owner = updateData.owner;
        }
        if (updateData.tasklist !== undefined || updateData.task_list !== undefined || updateData.taskList !== undefined) {
          updateFields.tasklist = updateData.tasklist || updateData.task_list || updateData.taskList;
        }

        // If no fields to update, return error
        if (Object.keys(updateFields).length === 0) {
          throw new Error("No valid fields provided for update");
        }
        
        const { data, error } = await supabase
          .from(projectTable)
          .update(updateFields)
          .eq("id", projectId)
          .select()
          .single();
      
        if (error) {
          console.error("Error updating project:", error);
          throw error;
        }
      
        console.log("Updated project:", data);
        return {
          success: true,
          message: "Project updated successfully",
          data: data,
          timestamp: new Date().toISOString()
        };
    },  

    async updateCollaborators(projectId, collaboratorIds) {
      const { supabase } = require("../db/supabase");
      const unique = Array.from(new Set(collaboratorIds || []));
    
      const { data, error } = await supabase
        .from("project")
        .update({ collaborators: unique })
        .eq("id", projectId)
        .select()
        .single();
    
      if (error) throw new Error(error.message);
      return data;
    },    

}