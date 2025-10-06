const Task = require("./Task");
const { supabase } = require("../db/supabase");
const { ValidationError, DatabaseError } = require("./TaskError");

class Subtask extends Task{
    constructor(data){
        super(data);
    }
    
    static async validateSubtaskParticipants(subTaskParticipants, taskParentId){
        const {data: taskParticipants, error} = await supabase
            .from(Task.taskParticipantTable)
            .select("profile_id")
            .eq("task_id", taskParentId);

        if (error){
            console.error("Error in validateSubtaskParticipants:", error);
            throw new DatabaseError("Failed to retrieve parent task participants", error);
        }

        const parentParticipantIds = taskParticipants.map(p => p.profile_id);
        const subTaskParticipantIds = subTaskParticipants.map(p => p.profile_id);
        const invalidParticipants = subTaskParticipantIds.filter(id => !parentParticipantIds.includes(id));

        if (invalidParticipants.length > 0){
            return {
                valid: false,
                errors: [`Subtask participants must be subset of parent. Invalid IDs: ${invalidParticipants.join(", ")}`]
            };
        }

        return {
            valid: true,
            errors: []
        };
    }

    static async getSubTasksOfParent(parentTaskId){
        const { data, error } = await supabase
            .from(Task.taskTable)
            .select('*')
            .eq('parent_task_id', parentTaskId);
        
        if (error){
            console.error("Error in getSubTasksOfParent:", error);
            throw new DatabaseError("Failed to retrieve subtasks", error);
        }

        return data || [];
    }

    async validate(){
        super.validate();
        const validation = await Subtask.validateSubtaskParticipants(this.participants, this.parent_task_id);

        if (!validation.valid){
            throw new ValidationError(validation.errors);
        }
    }

}
module.exports = Subtask;