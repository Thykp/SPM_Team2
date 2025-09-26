package com.spm.manage_task.services;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;

@Service
public class TaskService {
    
    private final String taskUrl = "http://task:3031/task";


    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ProfileService profileService;

    public List<TaskDto> getAllTasks(){
        ResponseEntity<TaskDto[]> responseEntity = restTemplate.getForEntity(taskUrl+"/all", TaskDto[].class);

        TaskDto[] tasks = responseEntity.getBody();

        return tasks == null ? List.of() : Arrays.asList(tasks);
    }

    public List<TaskDto> getUserTask(String userId){
        ResponseEntity<TaskDto[]> responseEntity = restTemplate.getForEntity(taskUrl+"/by-user/"+userId, TaskDto[].class);
        TaskDto[] tasks = responseEntity.getBody();
        return tasks == null ? List.of() : Arrays.asList(tasks);
    }

    public TaskDto createTask(TaskPostRequestDto newTaskBody ){
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        HttpEntity<TaskPostRequestDto> entity = new HttpEntity<>(newTaskBody, httpHeaders);

        ResponseEntity<TaskDto[]> resp = restTemplate.exchange(taskUrl+"/new", HttpMethod.POST, entity, TaskDto[].class);

        TaskDto[] tasks = resp.getBody();
        return (tasks != null && tasks.length > 0) ? tasks[0] : null;
    }

    public TaskDto updateTask(String taskId, TaskDto updatedTask) {
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        // Create the HTTP entity with the updated task data
        HttpEntity<TaskDto> entity = new HttpEntity<>(updatedTask, httpHeaders);

        // Send the PUT request to the atomic task microservice
        ResponseEntity<TaskDto> responseEntity = restTemplate.exchange(taskUrl + "/edit/" + taskId, HttpMethod.PUT, entity, TaskDto.class);

        // Return the updated task from the response
        return responseEntity.getBody();
    }

    public TaskDto getTaskById(String taskId) {
        ResponseEntity<TaskDto> responseEntity = restTemplate.getForEntity(taskUrl + "/id/" + taskId, TaskDto.class);
        return responseEntity.getBody();
    }

    public TaskDto getTaskByIdWithOwner(String taskId) {
        ResponseEntity<TaskDto> responseEntity = restTemplate.getForEntity(taskUrl + "/id/" + taskId, TaskDto.class);
        TaskDto task = responseEntity.getBody();

        if (task == null) {
            throw new RuntimeException("Task not found for ID: " + taskId);
        }

        if (task != null) {
            // Fetch owner details from the atomic profile microservice
            UserDto ownerDetails = profileService.getUserById(task.getTaskOwner());

            if (ownerDetails == null) {
                task.setTaskOwnerName("Unknown");
                task.setTaskOwnerDepartment("Unknown");
            }

            if (ownerDetails != null) {
                task.setTaskOwnerName(ownerDetails.getDisplayName()); // Populate owner's name
                task.setTaskOwnerDepartment(ownerDetails.getDepartment()); // Populate owner's department
            }
        }

        return task;
    }

    public List<TaskDto> getSubTaskByTaskId(String taskId){
        ResponseEntity<TaskDto[]> responseEntity = restTemplate.getForEntity(taskUrl+"/subtask/"+taskId, TaskDto[].class);
        TaskDto[] tasks = responseEntity.getBody();
        return tasks == null ? List.of() : Arrays.asList(tasks);
    }
    

}
