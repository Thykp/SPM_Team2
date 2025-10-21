package com.spm.manage_task.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;

import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.services.TaskService;

@RestController
@RequestMapping("api/task")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }


    @GetMapping("/")
    public ResponseEntity<List<TaskDto>> getAllTasks(){
        List<TaskDto> respBody = taskService.getAllTasks();
        return ResponseEntity.ok(respBody);
    }

    // GET based on user id
    @GetMapping("/{userId}")
    public ResponseEntity<List<TaskDto>> getUserTasks(@PathVariable String userId){
        List<TaskDto> respBody = taskService.getUserTask(userId);
        return ResponseEntity.ok(respBody);
    }

    // POST for task
    @PostMapping("/new")
    public ResponseEntity<String> createTask(@RequestBody TaskPostRequestDto taskReq) {
        try {
            taskService.createTask(taskReq);
            return ResponseEntity.status(200).body("Task created successfully");
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Task creation failed")) {
                // Return a proper JSON response
                return ResponseEntity.status(400)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
            }
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\": \"An unexpected error occurred: " + e.getMessage() + "\"}");
        }
    }

    // GET based on task id
    @GetMapping("/id/{taskId}")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable String taskId) {
        TaskDto task = taskService.getTaskByIdWithOwner(taskId);
        return ResponseEntity.ok(task);
    }
    
    // PUT route to update a task (based on task id)
    @PutMapping("/edit/{taskId}")
    public ResponseEntity<String> updateTask(@PathVariable String taskId, @RequestBody TaskPostRequestDto updatedTask) {
        try {
            taskService.updateTask(taskId, updatedTask);
            return ResponseEntity.status(200).body("Task updated successfully");
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Task update failed")) {
                // Extract the error message and return it as a proper JSON response
                String errorMessage = e.getMessage().replace("Task update failed: ", "");
                return ResponseEntity.status(400)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorMessage); // Directly return the error message
            }
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"error\": \"An unexpected error occurred: " + e.getMessage() + "\"}");
        }
    }

    // GET subtasks related to current task id
    @GetMapping("/subtask/{taskId}")
    public ResponseEntity<List<TaskDto>> getSubTaskByTaskId(@PathVariable String taskId) {
        List<TaskDto> tasks = taskService.getSubTaskByTaskId(taskId);
        return ResponseEntity.ok(tasks);
    }

    // DELETE a task based on task id
    @DeleteMapping("/{taskId}")
    public ResponseEntity<String> deleteTask(@PathVariable String taskId) {
        try {
            taskService.deleteTask(taskId);
            return ResponseEntity.ok("Task deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body("Failed to delete task: " + e.getMessage());
        }
    }
    
    // DELETE task by task id
    @DeleteMapping("/{taskId}")
    public ResponseEntity<String> deleteTask(@PathVariable String taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.ok("Task deleted successfully");
    }
    
}
