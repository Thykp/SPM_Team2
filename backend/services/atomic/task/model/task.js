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
            owner: task.owner,
            parent: task.parent
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
        .contains('collaborators', [user_id])

      if (error) {
        console.error("Error getting task related to user:", error);
        throw error;
      }
      
      return data || [];
    },

    async updateTask(taskId, updatedTask) {
        const { data, error } = await supabase
            .from(taskTable)
            .update({
                title: updatedTask.title,
                deadline: updatedTask.deadline,
                description: updatedTask.description,
                status: updatedTask.status,
                collaborators: updatedTask.collaborators,
                owner: updatedTask.owner,
                parent: updatedTask.parent
            })
            .eq('id', taskId); // Match the row where the id equals taskId

        if (error) {
            console.error("Error updating task:", error);
            throw error;
        }

        console.log("Updated task:", data);
        return data;
    },

}

