package com.spm.manage_task.dto;

import java.util.ArrayList;

import org.springframework.http.ResponseEntity;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TaskDto {
    @JsonProperty("id")
    private String taskId;

    @JsonProperty("title")
    private String taskTitle;

    @JsonProperty("deadline")
    private String taskDeadline;

    @JsonProperty("description")
    private String taskDescription;

    @JsonProperty("status")
    private String taskStatus;

    @JsonProperty("collaborators")
    private ArrayList<String> taskCollaborators;

    @JsonProperty("owner")
    private String taskOwner;

    @JsonProperty("parent")
    private String taskParent;


    public TaskDto(String taskId, String taskTitle, String taskDeadline, String taskDescription, String taskStatus, ArrayList<String> taskCollaborators, String taskOwner, String taskParent) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.taskDeadline = taskDeadline;
        this.taskDescription = taskDescription;
        this.taskStatus = taskStatus;
        this.taskCollaborators = taskCollaborators;
        this.taskOwner = taskOwner;
        this.taskParent = taskParent;
    }

    @Override
    public String toString(){
        return "TaskDto{" +
                "taskId='" + taskId + '\'' +
                ", taskDeadline='" + taskDeadline + '\'' +
                ", taskTitle='" + taskTitle + '\'' +
                ", taskStatus=" + taskStatus +
                ", taskDescription='" + taskDescription + '\'' +
                ", taskOwner='" + taskOwner + '\'' +
                ", taskCollaborators=" + taskCollaborators +
                '}';
    }
    
}
