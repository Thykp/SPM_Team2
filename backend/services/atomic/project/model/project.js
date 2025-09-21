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
            task_list: project.task_list || project.taskList
          }])
          .select();
      
        if (error) {
          console.error("Error inserting project:", error);
          throw error;
        }
      
        console.log("Inserted project:", data);
        return {
          success: true,
          message: "Project created successfully",
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