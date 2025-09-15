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

    async addNewProj(project) {
        const { data, error } = await supabase
          .from(projectTable)
          .insert([{
            title: project.title,
            description: project.description,
            collaborators: project.collaborators,
            owner: project.owner,
            task_list:project.task_list
          }])
          .select(); // Add .select() to return the inserted data
      
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

}