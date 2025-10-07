const { supabase } = require("../db/supabase");
const { TaskNotFoundError, ValidationError, DatabaseError } = require("./TaskError");

class Task {
    static taskTable = "revamped_task";
    static taskParticipantTable = "revamped_task_participant";


    static deduplicateTasksById(tasks) {
        if (!tasks || tasks.length === 0) {
            return [];
        }
        
        return Array.from(
            new Map(tasks.map(task => [task.id, task])).values()
        );
    }

    static normalizeStatus(input) {
        if (!input) return null;

        const s = String(input).trim().toLowerCase().replace(/[_-]+/g, " ");

        // order matters; check the most specific first
        if (/^under\s*review$/.test(s)) return "Under Review";
        if (/^(completed|done)$/.test(s)) return "Completed";
        if (/^(overdue)$/.test(s)) return "Overdue";
        if (/^(ongoing|in\s*progress|pending)$/.test(s)) return "Ongoing";
        if (/^(unassigned|un\s*assigned|not\s*assigned)$/.test(s)) return "Unassigned";

        // If it already matches, preserve original casing if provided,
        // otherwise capitalize nicely as a fallback.
        if (s === "ongoing") return "Ongoing";
        if (s === "under review") return "Under Review";
        if (s === "completed") return "Completed";
        if (s === "overdue") return "Overdue";
        if (s === "unassigned") return "Unassigned";

        // last resort: return the original input (lets Supabase error if invalid)
        return input;
    }

    static async getAllTasks(){
        const { data, error } = await supabase
            .from(Task.taskTable)
            .select(`
                *,
                participants:${Task.taskParticipantTable}(profile_id, is_owner)
            `);
        
        if (error){
            console.error("Error executing getAllTasks: ", error);
            throw new DatabaseError("Failed to retrieve tasks", error);
        }
        
        return data;
    }

    static async getTasksByUsers(userId){
        const userIdArray = !Array.isArray(userId) ? [userId]: userId;
        
        // Get all tasks with their full participants array
        const { data, error } = await supabase
            .from(Task.taskTable)
            .select(`
                *,
                participants:${Task.taskParticipantTable}(profile_id, is_owner)
            `);
        
        if (error){
            console.error("Error in getTasksByUsers:", error);
            throw new DatabaseError("Failed to retrieve tasks by users", error);
        }
        
        // Filter tasks where at least one participant matches the userIdArray
        const filteredTasks = [];
        for (const task of data) {
            if (task.participants) {
                for (const participant of task.participants) {
                    if (userIdArray.includes(participant.profile_id)) {
                        filteredTasks.push(task);
                        break;
                    }
                }
            }
        }
        
        return filteredTasks;
    }

    constructor(data){
        this.id = data.id || null;
        this.parent_task_id = data.parent_task_id || null;
        this.project_id = data.project_id || null;
        this.title = data.title || null;
        this.deadline = data.deadline || null;
        this.description = data.description || null;
        this.status = Task.normalizeStatus(data.status) || null;
        this.participants = data.participants || [];
    }

    async validate(){
        const errors = [];
        const validStatuses = ["Ongoing", "Under Review", "Completed", "Overdue", "Unassigned"];

        if (!this.title || this.title.trim() === "") {
            errors.push("Title is required");
        }

        if (!this.deadline) {
            errors.push("Deadline is required");
        }

        if (!this.description || this.description.trim() === "") {
            errors.push("Description is required");
        }

        if (!this.status) {
            errors.push("Status is required");
        } else if (!validStatuses.includes(this.status)) {
            errors.push("Status must be one of: Ongoing, Under Review, Completed, Overdue, Unassigned");
        }

        if (!this.participants || this.participants.length === 0) {
            errors.push("At least one participant is required");
        }

        const ownerCount = this.participants.filter(p => p.is_owner).length;
        if (ownerCount === 0) {
            errors.push("At least one participant must be an owner");
        }

        if (errors.length > 0) {
            throw new ValidationError(errors);
        }

        return true;
    }

    async getTaskDetails(){
        const { data, error } = await supabase
            .from(Task.taskTable)
            .select(`
                *,
                participants:${Task.taskParticipantTable}(profile_id, is_owner)
            `)
            .eq('id', this.id)
            .single()

        if (error){
            console.error("Error in getTaskDetails:", error);
            if (error.code === 'PGRST116') {
                throw new TaskNotFoundError(`Task with ID ${this.id} not found`);
            }
            throw new DatabaseError("Failed to retrieve task details", error);
        }

        return data;
    }

    async createTask(){
        const { data, error } = await supabase
        .from(Task.taskTable)
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
            console.error("Error in createTask:", error);
            throw new DatabaseError("Failed to create task", error);
        }

        this.id = data.id;

        if (this.participants.length > 0){
            await this.addTaskParticipants();
        }
    }

    async updateTask(){
        const { error } = await supabase
            .from(Task.taskTable)
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
            console.error("Error in updateTask:", error);
            throw new DatabaseError("Failed to update task", error);
        }

        await this.deleteTaskParticipants();
        await this.addTaskParticipants();
    }

    async deleteTask(){
        const { data, error } = await supabase
            .from(Task.taskTable)
            .delete()
            .eq('id', this.id)
            .select()
        if (error){
            console.error("Error in deleteTask:", error);
            throw new DatabaseError("Failed to delete task", error);
        }
    }

    async addTaskParticipants(){
        const participantDetails = this.participants.map(participant => ({
            task_id: this.id,
            profile_id: participant.profile_id,
            is_owner : participant.is_owner || false
        }))

        const { error } = await supabase
            .from(Task.taskParticipantTable)
            .insert(participantDetails);
        
        if (error){
            console.error("Error in addTaskParticipants: ", error);
            throw new DatabaseError("Failed to add task participants", error);
        }
    }

    async deleteTaskParticipants(){
        const {data, error} = await supabase
            .from(Task.taskParticipantTable)
            .delete()
            .eq('task_id', this.id)
            .select()
        
        if (error){
            console.error("Error in deleteTaskParticipants: ", error);
            throw new DatabaseError("Failed to delete task participants", error);
        }
    }

    async getTaskParticipants(){
        const { data, error } = await supabase
            .from(Task.taskParticipantTable)
            .select('*')
            .eq('task_id', this.id)
        
        if (error){
            console.error("Error in getTaskParticipants: ", error);
            throw new DatabaseError("Failed to retrieve task participants", error);
        }
        
        return data || [];
    }

}

module.exports = Task;