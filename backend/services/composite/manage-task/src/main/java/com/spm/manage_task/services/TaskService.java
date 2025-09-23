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

    public TaskDto getTaskById(String taskId) {
        ResponseEntity<TaskDto> responseEntity = restTemplate.getForEntity(taskUrl + "/id/" + taskId, TaskDto.class);
        return responseEntity.getBody();
    }
    

}
