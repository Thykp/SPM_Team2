const { Task } = require("./task");
const { supabase } = require("../db/supabase");

class Subtasks extends Task{

    // method to validate participants
        // get the list of participants using taskParentId
        // check the new one is a subset or equals to the parent's one
    static async validateSubtaskParticipants(subTaskParticipants, taskParentId){
        const {data: taskParticipants, error} = await supabase
            .from(this.taskParticipantTable)
            .select("profile_id")
            .eq("id",taskParentId);

        if (error){
            console.error("Error with retreiving parent task participants");
        }

        const participantList = subTaskParticipants.map((currParticipant) => currParticipant.profile_id)

        for (let subTaskParticipant of participantList) {
            if (!taskParticipants.includes(subTaskParticipant)){
                return false;
            }
        }
        return true;
    }

    async validate(){

    }
    // method to validate participants
        // run helper function to validate subtask participants

    // static method to find all subtask of parent
        // run thhe suspabase api
        // map and wrap Subtask class
        // return
}