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
          }]);
      
        if (error) {
          console.error("Error inserting task:", error);
          throw error;
        }
      
        console.log("Inserted task:", data);
        return data;
    },

    async getTasksRelatedToUser(user_id){
      const { data, error } = await supabase
        .from(taskTable)
        .select()
        .eq('collaborators', [user_id])

      if (error) {
        console.error("Error getting task related to :", error);
        throw error;
      }
      
      return data || [];
    }

}

