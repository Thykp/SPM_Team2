package com.spm.manage_task.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.spm.manage_task.factory.Participant;

public class TaskPostRequestDto {

    @JsonProperty("priority")
    private int taskPriority;

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

    @JsonProperty("participants")
    public List<Participant> getParticipants() {
        return processCollaborators();
    }


    public TaskPostRequestDto(String taskTitle, String taskDeadline, String taskProjectId, String taskDescription,
            String taskStatus, ArrayList<String> taskCollaborators, String taskOwner, String taskParent, int taskPriority) {
        this.taskTitle = taskTitle;
        this.taskDeadline = taskDeadline;
        this.taskProjectId = taskProjectId;
        this.taskDescription = taskDescription;
        this.taskStatus = taskStatus;
        this.taskCollaborators = taskCollaborators;
        this.taskOwner = taskOwner;
        this.taskParent = taskParent;
        this.taskPriority = taskPriority;
    }
    public int getTaskPriority() {
        return taskPriority;
    }

    public void setTaskPriority(int taskPriority) {
        this.taskPriority = taskPriority;
    }

    public List<Participant> processCollaborators(){
        Map<String, Participant> participantMap = new HashMap<>();

        // Add the owner to the participant map
        if (this.taskOwner != null) {
            participantMap.put(this.taskOwner, new Participant(true, this.taskOwner));
        }

        // Add collaborators to the participant map (if they are not already the owner)
        if (this.taskCollaborators != null) {
            for (String collaborator : this.taskCollaborators) {
                participantMap.putIfAbsent(collaborator, new Participant(false, collaborator));
            }
        }

        // Convert the map back to a list
        return new ArrayList<>(participantMap.values());
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
