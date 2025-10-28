const Task = require("../model/task");
const Subtask = require("../model/Subtask");
const TaskService = require("../service/TaskService");
const { TaskNotFoundError, ValidationError, DatabaseError } = require("../model/TaskError");

module.exports = {
    async taskServiceHealthCheck(req,res){
        try {
            res.status(200).json('Health Check: Success!');
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    },

    async addTask(req, res){
        try {
            const currTask = TaskService.checkTask(req.body);
            await currTask.validate();
            await currTask.createTask();
            res.status(200).json({ message: "Successfully created task and task participants" });
        } catch (error) {
            if (error instanceof ValidationError) {
                return res.status(error.statusCode).json({ 
                    error: error.message
                });
            }
            if (error instanceof DatabaseError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    },  

    async getAllTasks(req, res){
        try {
            const tasks = await Task.getAllTasks();
            res.status(200).json(tasks);
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    },

    async getTaskDetail(req, res){
        try {
            const taskId = req.params.id;
            const taskObj = new Task({id:taskId})
            const taskDetails = await taskObj.getTaskDetails();
            res.status(200).json(taskDetails);
        } catch (error) {
            if (error instanceof TaskNotFoundError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            if (error instanceof DatabaseError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    },

    async getSubTasks(req, res){
        try {
            const parentTaskId = req.params.id;
            const subTasks = await Subtask.getSubTasksOfParent(parentTaskId);
            res.status(200).json(subTasks);
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    },

    async getTaskPerUser(req, res){
        try {
            const userId = !req.params.userId ? req.body : req.params.userId;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;


            const tasks = await Task.getTasksByUsers(userId, startDate, endDate);
            res.status(200).json(tasks);
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    },

    async getTasksByProject(req, res){
        try {
            const projectId = req.params.projectId;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;

            const tasks = await Task.getTasksByProject(projectId, startDate, endDate);
            res.status(200).json(tasks);
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    },

    async updateTask(req, res){
        try {
            console.log("Incoming payload:", req.body);
            const taskId = req.params.id;
            const newtaskObj = TaskService.checkTask({ id: taskId, ...req.body });
            await newtaskObj.validate();
            await newtaskObj.updateTask();
            res.status(200).json({ message: "Successfully updated task and task participants" });
        } catch (error) {
            if (error instanceof ValidationError) {
                return res.status(error.statusCode)
                    .set('Content-Type', 'application/json')
                    .json({ error: error.message });
            }
            if (error instanceof DatabaseError){
                return res.status(error.statusCode).json({ error: error.message }); 
            }
            return res.status(500).json({ error: error.message });
        }
    },

    async deleteTask(req, res){
        try {
            const taskObj = new Task({id:req.params.taskId});
            await taskObj.deleteTask();
            res.status(200).json({ message: "Successfully deleted task" });
        } catch (error) {
            if (error instanceof DatabaseError){
                return res.status(error.statusCode).json({ error: error.message })
            };
            return res.status(500).json({ error: error.message })
        }
    },

    async getTaskDeadlineReminder (req, res) {
        try {
            const { id, userId } = req.params;
            const task = new Task({ id });
            const reminder = await task.getDeadlineReminder(userId);
            return res.status(200).json({
                task_id: id,
                deadline_reminder: reminder
            });

        } catch (error) {
            console.error("Error in getTaskDeadlineReminder:", error);
            if (error instanceof TaskNotFoundError) {
                return res.status(404).json({ error: error.message });
            }
            if (error instanceof DatabaseError) {
                return res.status(500).json({ error: "Database error occurred" });
            }
            return res.status(500).json({ error: "Internal server error" });
        }
    },


    async setTaskDeadlineReminder(req, res) {
        try {
            const { id, userId } = req.params;
            const { deadline_reminder } = req.body;

            if (!Array.isArray(deadline_reminder)) {
                return res.status(400).json({ error: "deadline_reminder must be an array" });
            }

            const task = new Task({ id });
            await task.setDeadlineReminder(userId, deadline_reminder);

            return res.status(200).json({
                task_id: id,
                deadline_reminder
            });
        } catch (error) {
            console.error("Error in setTaskDeadlineReminder:", error);
            if (error instanceof TaskNotFoundError) {
                return res.status(404).json({ error: error.message });
            }
            if (error instanceof DatabaseError) {
                return res.status(500).json({ error: "Database error occurred" });
            }
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    async getTaskParticipants(req, res) {
        try {
            const taskId = req.params.id; // Extract task ID from the route parameter
            const taskObj = new Task({ id: taskId }); // Create a Task instance
            const participants = await taskObj.getTaskParticipants(); // Fetch participants
            res.status(200).json(participants); // Return participants as JSON
        } catch (error) {
            console.error("Error in getTaskParticipants:", error);
            if (error instanceof DatabaseError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async addComment(req, res) {
        try {
            const { id: taskId, userId } = req.params; // Extract taskId and userId from route parameters
            const { comment } = req.body; // Extract comment from request body

            if (!comment || comment.trim() === "") {
                return res.status(400).json({ error: "Comment cannot be empty" });
            }

            const taskObj = new Task({ id: taskId }); // Create a Task instance
            const updatedComments = await taskObj.addComment(userId, comment); // Call the model method

            res.status(200).json({
                message: "Comment added successfully",
                comments: updatedComments,
            });
        } catch (error) {
            console.error("Error in addComment:", error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof DatabaseError) {
                return res.status(500).json({ error: error.message });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    },

    async removeComment(req, res) {
        try {
            const { id: taskId, userId } = req.params; // Extract taskId and userId from route parameters
            const { comment } = req.body; // Extract comment from request body

            if (!comment || comment.trim() === "") {
                return res.status(400).json({ error: "Comment cannot be empty" });
            }

            const taskObj = new Task({ id: taskId }); // Create a Task instance
            const updatedComments = await taskObj.removeComment(userId, comment); // Call the model method

            res.status(200).json({
                message: "Comment removed successfully",
                comments: updatedComments,
            });
        } catch (error) {
            console.error("Error in removeComment:", error);
            if (error instanceof ValidationError) {
                return res.status(400).json({ error: error.message });
            }
            if (error instanceof DatabaseError) {
                return res.status(500).json({ error: error.message });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    }

}