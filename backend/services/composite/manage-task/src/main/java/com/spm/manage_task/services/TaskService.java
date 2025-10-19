package com.spm.manage_task.services;

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

import com.spm.manage_task.components.TaskDTOWrapperComponent;
import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.factory.TaskMicroserviceResponse;
import com.spm.manage_task.factory.TaskMicroserviceUpsertRequest;

@Service
public class TaskService {
    
    private final String taskUrl = "http://task:3031/task";


    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private TaskDTOWrapperComponent taskDTOWrapper;

    public List<TaskDto> getAllTasks(){
        ResponseEntity<TaskMicroserviceResponse[]> responseEntity = restTemplate.getForEntity(
            taskUrl + "/", 
            TaskMicroserviceResponse[].class
        );

        TaskMicroserviceResponse[] rawTasks = responseEntity.getBody();
        List<TaskDto> taskDtos = taskDTOWrapper.toTaskDtoList(rawTasks);
        
        return taskDtos;
    }

    public List<TaskDto> getUserTask(String userId){
        ResponseEntity<TaskMicroserviceResponse[]> responseEntity = restTemplate.getForEntity(
            taskUrl+"/users/"+userId, 
            TaskMicroserviceResponse[].class
        );

        TaskMicroserviceResponse[] rawTasks = responseEntity.getBody();
        List<TaskDto> taskDtos = taskDTOWrapper.toTaskDtoList(rawTasks);
        
        return taskDtos == null ? List.of() : taskDtos;
    }

    public void createTask(TaskPostRequestDto newTaskBody){
        TaskMicroserviceUpsertRequest upsertRequest = taskDTOWrapper.toTaskMicroserviceUpsert(newTaskBody);
        
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        HttpEntity<TaskMicroserviceUpsertRequest> entity = new HttpEntity<>(upsertRequest, httpHeaders);

        ResponseEntity<TaskMicroserviceResponse> resp = restTemplate.exchange(taskUrl+"/", HttpMethod.POST, entity, TaskMicroserviceResponse.class);

        if (resp.getStatusCode().value() != 200) {
            throw new RuntimeException("Failed to create task. Status code: " + resp.getStatusCode());
        }
    }

    public void updateTask(String taskId, TaskPostRequestDto updatedTask) {
        TaskMicroserviceUpsertRequest upsertRequest = taskDTOWrapper.toTaskMicroserviceUpsert(updatedTask);
        
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<TaskMicroserviceUpsertRequest> entity = new HttpEntity<>(upsertRequest, httpHeaders);

        ResponseEntity<TaskMicroserviceResponse> responseEntity = restTemplate.exchange(taskUrl + "/" + taskId, HttpMethod.PUT, entity, TaskMicroserviceResponse.class);

        if (responseEntity.getStatusCode().value() != 200) {
            throw new RuntimeException("Failed to update task. Status code: " + responseEntity.getStatusCode());
        }
    }

    public TaskDto getTaskByIdWithOwner(String taskId) {
        ResponseEntity<TaskMicroserviceResponse> responseEntity = restTemplate.getForEntity(taskUrl + "/" + taskId, TaskMicroserviceResponse.class);

        TaskMicroserviceResponse rawResponse = responseEntity.getBody();

        if (rawResponse == null) {
            throw new RuntimeException("Task not found for ID: " + taskId);
        }

        TaskDto taskResponse = taskDTOWrapper.toTaskDto(rawResponse);
        taskDTOWrapper.addOwnerInformation(taskResponse);

        return taskResponse;
    }

    public List<TaskDto> getSubTaskByTaskId(String taskId){
        ResponseEntity<TaskMicroserviceResponse[]> responseEntity = restTemplate.getForEntity(taskUrl+"/"+taskId+"/subtasks", TaskMicroserviceResponse[].class);

        TaskMicroserviceResponse[] rawTasks = responseEntity.getBody();
        List<TaskDto> taskDtos = taskDTOWrapper.toTaskDtoList(rawTasks);


        return taskDtos == null ? List.of() : taskDtos;
    }

    public void deleteTask(String taskId) {
        ResponseEntity<Void> responseEntity = restTemplate.exchange(
            taskUrl + "/" + taskId, 
            HttpMethod.DELETE, 
            null, 
            Void.class
        );

        if (responseEntity.getStatusCode().value() != 200 && responseEntity.getStatusCode().value() != 204) {
            throw new RuntimeException("Failed to delete task. Status code: " + responseEntity.getStatusCode());
        }
    }

}
