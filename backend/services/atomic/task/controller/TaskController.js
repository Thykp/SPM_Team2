const Task = require("../model/Task");
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
                    error: error.message, 
                    details: error.errors 
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
            const tasks = await Task.getTasksByUsers(userId);
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
            // const taskId = req.params.id;
            const newtaskObj = new Task(req.body);
            await newtaskObj.updateTask();
            res.status(201).json({ message: "Successfully created task and task participants" });
        } catch (error) {
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
    }

}