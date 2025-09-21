package com.spm.manage_task.dto;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TaskPostRequestDto {

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

    public TaskPostRequestDto(String taskTitle, String taskDeadline, String taskDescription, String taskStatus,
            ArrayList<String> taskCollaborators, String taskOwner, String taskParent) {
        this.taskTitle = taskTitle;
        this.taskDeadline = taskDeadline;
        this.taskDescription = taskDescription;
        this.taskStatus = taskStatus;
        this.taskCollaborators = taskCollaborators;
        this.taskOwner = taskOwner;
        this.taskParent = taskParent;
    }

    

}
