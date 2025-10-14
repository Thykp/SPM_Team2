const Task  = require("../model/task");
const Subtask  = require("../model/Subtask");

class TaskService {
    // method to check if incoming body is task or subtask
    static checkTask(incomingTaskBody){
        if (incomingTaskBody.parent_task_id){
            return new Subtask(incomingTaskBody);
        }
        return new Task(incomingTaskBody);
    }
}

module.exports = TaskService;
