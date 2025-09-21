const { supabase } = require("../db/supabase");
const taskTable = "task";

module.exports = {

    async getAllTasks() {
        const { data } = await supabase
            .from(taskTable)
            .select('*')

        console.log(data)
        return data;
    },

    async addNewTask(task) {
        const { data, error } = await supabase
          .from(taskTable)
          .insert([{
            title: task.title,
            deadline: task.deadline,
            description: task.description,
            status: task.status,
            collaborators: task.collaborators,
            owner: task.owner
          }])
          .select();
      
        if (error) {
          console.error("Error inserting task:", error);
          throw error;
        }
      
        console.log("Inserted task:", data);
        return data;
    },
    
    async getTasksPerUser(userId) {
      // Get tasks where user is owner
      const { data: ownerTasks, error: ownerError } = await supabase
        .from(taskTable)
        .select('*')
        .eq('owner', userId);
      if (ownerError) throw new Error(ownerError.message);

      // Get tasks where user is a collaborator
      const { data: collabTasks, error: collabError } = await supabase
        .from(taskTable)
        .select('*')
        .contains('collaborators', [userId]);
      if (collabError) throw new Error(collabError.message);

      const allTasks = [...ownerTasks, ...collabTasks];
      const uniqueTasks = Object.values(
        allTasks.reduce((acc, task) => {
          acc[task.id] = task;
          return acc;
        }, {})
      );
      return uniqueTasks;
    },


}

