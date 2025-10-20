package com.spm.manage_task.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.service.annotation.PatchExchange;

import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.dto.TaskReminderDto;
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
    public ResponseEntity<String> createTask(@RequestBody TaskPostRequestDto taskReq){
        taskService.createTask(taskReq);
        return ResponseEntity.status(200).body("Task created successfully");
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
        taskService.updateTask(taskId, updatedTask);
        return ResponseEntity.ok("Task updated successfully");
    }

    // GET subtasks related to current task id
    @GetMapping("/subtask/{taskId}")
    public ResponseEntity<List<TaskDto>> getSubTaskByTaskId(@PathVariable String taskId) {
        List<TaskDto> tasks = taskService.getSubTaskByTaskId(taskId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/reminder/{taskId}/{userId}")
    public ResponseEntity<TaskReminderDto> getTaskDeadlineReminder(@PathVariable String taskId, @PathVariable String userId) {
        TaskReminderDto reminder = taskService.getTaskDeadlineReminder(taskId, userId);
        return ResponseEntity.ok(reminder);
    }


   @PostMapping("/reminder/{taskId}/{userId}")
public ResponseEntity<Map<String, Object>> setTaskDeadlineReminder(
        @PathVariable String taskId,
        @PathVariable String userId,
        @RequestBody Map<String, List<Integer>> requestBody) {

    List<Integer> reminders = requestBody.get("deadline_reminder");
    if (reminders == null) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", "deadline_reminder must be provided"));
    }

    try {
        taskService.setTaskDeadlineReminder(taskId, userId, reminders);

        // Return immediately what was sent
        return ResponseEntity.ok(Map.of(
                "task_id", taskId,
                "deadline_reminder", reminders
        ));
    } catch (Exception e) {
        // log the full exception to see why 500 occurs
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of(
                "error", "Failed to update deadline reminder",
                "details", e.getMessage()
        ));
    }
}


    
}
