package com.spm.manage_task.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping()
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
    public ResponseEntity<TaskDto> createTask(@RequestBody TaskPostRequestDto taskReq){
        TaskDto respBody = taskService.createTask(taskReq);
        return ResponseEntity.status(201).body(respBody);
    }

    // GET based on task id
    @GetMapping("/id/{taskId}")
    public ResponseEntity<TaskDto> getTaskById(@PathVariable String taskId) {
        TaskDto task = taskService.getTaskById(taskId);
        return ResponseEntity.ok(task);
    }

    
}
