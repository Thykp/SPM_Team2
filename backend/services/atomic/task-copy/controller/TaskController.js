const Task = require("../model/task")

module.exports = {
    async taskServiceHealthCheck(req,res){
        try {
            res.status(200).json('Health Check: Success!');
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    },

    async getAllTasks(req, res){
        try {
            const tasks = await Task.getAllTasks();
            res.status(200).json(tasks);
        } catch (error) {
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
            res.status(500).json({ error: error.message });
        }
    },

    // NEED TO CHANGE TO ACCOMODATE FOR SUBTASK
    // async addTask(req, res){
    //     try {
    //         const taskReqBody = new Task(req.body);
    //         await taskReqBody.createTask();
    //         res.status(200).json("works");
    //     } catch (error) {
    //         res.status(500).json({ error: error.message });
    //     }
    // }
    
}