const { supabase } = require("../db/supabase");



class Task {
    taskTable = "revamped_task";
    taskParticipantTable = "revamped_task_participant";
    
    static normalizeStatus(input) {
        if (!input) return null;

        const s = String(input).trim().toLowerCase().replace(/[_-]+/g, " ");

        // order matters; check the most specific first
        if (/^under\s*review$/.test(s)) return "Under Review";
        if (/^(completed|done)$/.test(s)) return "Completed";
        if (/^(overdue)$/.test(s)) return "Overdue";
        if (/^(ongoing|in\s*progress|pending)$/.test(s)) return "Ongoing";

        // If it already matches, preserve original casing if provided,
        // otherwise capitalize nicely as a fallback.
        if (s === "ongoing") return "Ongoing";
        if (s === "under review") return "Under Review";
        if (s === "completed") return "Completed";
        if (s === "overdue") return "Overdue";

        // last resort: return the original input (lets Supabase error if invalid)
        return input;
    }

    static async getAllTasks(){
        const { data, error } = await supabase
            .from(taskTable)
            .select(`
                *,
                participants:${taskParticipantTable}(profile_id, is_owner)
            `);
        if (error){
            console.error("Error executing getAllTasks: ", error);
            throw error;
        }
        return data;
    }

    constructor(data){
        this.id = data.id || null;
        this.parent_task_id = data.parent_task_id || null;
        this.project_id = data.project_id || null;
        this.title = data.title || null;
        this.deadline = data.deadline || null;
        this.description = data.description || null;
        this.status = Task.normalizeStatus(data.status) || null;
        this.participants = data.participants || []
    }

    async getTaskDetails(){
        const { data, error } = await supabase
            .from(taskTable)
            .select(`
                *,
                participants:revamped_task_participant(profile_id, is_owner)
            `)
            .eq('id', this.id)
            .single()

        if (error){
            console.error("Error with getTaskDetails: ", error)
            throw error;
        }

        // const retrievedTask = new Task(data)
        return data;
    }

    // method to add task to db
        // call the supabase api to add into task table
        // check if error   
            // return yup
        // check if have participant list
            // activate the add participant helper function
    async createTask(){
        const { data, error } = await supabase
        .from(taskTable)
        .insert({
            parent_task_id: this.parent_task_id, 
            project_id: this.project_id, 
            title: this.title, 
            deadline: this.deadline, 
            description: this.description, 
            status: this.status
        })
        .select()
        .single()

        if (error){
            console.error("Error executing createTask: ", error);
            throw error;
        }

        this.id = data.id;

        if (this.participants.length > 0){
            await this.addTaskParticipants();
        }
    }

    // method to update task from db
        // call supabase api
        // check if error   
            // return yup
        // run helper function to delete participants
        // run helper function to add participants
    async updateTask(){
        const { error } = await supabase
            .from(taskTable)
            .update({
                parent_task_id: this.parent_task_id, 
                project_id: this.project_id, 
                title: this.title, 
                deadline: this.deadline, 
                description: this.description, 
                status: this.status
            })
            .eq('id', this.id)
        
        if (error){
            return null;
        }

        this.deleteTaskParticipants();
        this.addTaskParticipants();
    }

    // Helper function to add to task_participant table
        // map participants to appropriate data type INCLUDING the isOwner or not
        // run the supabase api to add the records
    async addTaskParticipants(){
        const participantDetails = this.participants.map(participant => ({
            task_id: this.id,
            profile_id: participant.profile_id,
            is_owner : participant.is_owner || false
        }))

        const { error } = await supabase
            .from(taskParticipantTable)
            .insert(participantDetails);
        
        if (error){
            console.error("Error in addTaskParticipants: ", error)
            throw error;
        }
    }

    // Helper function  to delete participants
        // run supabase api to delete all that have the same task_id
    async deleteTaskParticipants(){
        const {data, error} = await supabase
            .from(taskParticipantTable)
            .delete()
            .eq('task_id', this.id)
            .select()
        
        if (error){
            return null;
        }
    }

    // Helper function to get participants
        // run the supabase api to retrieve list of participants based on task id
    async getTaskParticipants(){
        const { data, error } = await supabase
            .from(taskParticipantTable)
            .select('*')
            .eq('task_id', this.id)
        
        if (error){
            return null;
        }
        
        return data;
    }

}

module.exports = Task;