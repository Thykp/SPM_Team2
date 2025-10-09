package com.spm.manage_task.dto;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.spm.manage_task.factory.Participant;

public class TaskPostRequestDto {

    private String taskId;

    @JsonProperty("title")
    private String taskTitle;

    @JsonProperty("deadline")
    private String taskDeadline;

    @JsonProperty("project_id")
    private String taskProjectId;

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


    public TaskPostRequestDto(String taskTitle, String taskDeadline, String taskProjectId, String taskDescription,
            String taskStatus, ArrayList<String> taskCollaborators, String taskOwner, String taskParent) {
        this.taskTitle = taskTitle;
        this.taskDeadline = taskDeadline;
        this.taskProjectId = taskProjectId;
        this.taskDescription = taskDescription;
        this.taskStatus = taskStatus;
        this.taskCollaborators = taskCollaborators;
        this.taskOwner = taskOwner;
        this.taskParent = taskParent;
    }

    public List<Participant> processCollaborators(){
        List<Participant> participants = new ArrayList<>();
        
        if (this.taskOwner != null) {
            participants.add(new Participant(true, this.taskOwner));
        }
        
        if (this.taskCollaborators != null) {
            for (String collaborator : this.taskCollaborators) {
                participants.add(new Participant(false, collaborator));
            }
        }
        
        return participants;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public String getTaskDeadline() {
        return taskDeadline;
    }

    public String getTaskProjectId() {
        return taskProjectId;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public String getTaskStatus() {
        return taskStatus;
    }

    public ArrayList<String> getTaskCollaborators() {
        return taskCollaborators;
    }

    public String getTaskOwner() {
        return taskOwner;
    }

    public String getTaskParent() {
        return taskParent;
    }

    
}
