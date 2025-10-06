package com.spm.manage_task.dto;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TaskDto {
    @JsonProperty("id")
    private String taskId;

    @JsonProperty("title")
    private String taskTitle;

    @JsonProperty("project_id")
    private String taskProjectId;

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

    @JsonProperty("ownerName")
    private String taskOwnerName;

    @JsonProperty("ownerDepartment")
    private String taskOwnerDepartment;


    public TaskDto(String taskId, String taskTitle, String taskProjectId, String taskDeadline, String taskDescription,
            String taskStatus, ArrayList<String> taskCollaborators, String taskOwner, String taskParent,
            String taskOwnerName, String taskOwnerDepartment) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.taskProjectId = taskProjectId;
        this.taskDeadline = taskDeadline;
        this.taskDescription = taskDescription;
        this.taskStatus = taskStatus;
        this.taskCollaborators = taskCollaborators;
        this.taskOwner = taskOwner;
        this.taskParent = taskParent;
        this.taskOwnerName = taskOwnerName;
        this.taskOwnerDepartment = taskOwnerDepartment;
    }

    @Override
    public String toString(){
        return "TaskDto{" +
                "taskId='" + taskId + '\'' +
                ", taskDeadline='" + taskDeadline + '\'' +
                ", taskProjectid='" + taskProjectId + '\'' +
                ", taskTitle='" + taskTitle + '\'' +
                ", taskStatus=" + taskStatus +
                ", taskDescription='" + taskDescription + '\'' +
                ", taskOwner='" + taskOwner + '\'' +
                ", taskOwnerName='" + taskOwnerName + '\'' +
                ", taskOwnerDepartment='" + taskOwnerDepartment + '\'' +
                ", taskCollaborators=" + taskCollaborators +
                ", taskParent='" + taskParent + '\'' +
                '}';
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public String getTaskProjectId() {
        return taskProjectId;
    }

    public void setTaskProjectId(String taskProjectId) {
        this.taskProjectId = taskProjectId;
    }

    public String getTaskDeadline() {
        return taskDeadline;
    }

    public void setTaskDeadline(String taskDeadline) {
        this.taskDeadline = taskDeadline;
    }

    public String getTaskDescription() {
        return taskDescription;
    }

    public void setTaskDescription(String taskDescription) {
        this.taskDescription = taskDescription;
    }

    public String getTaskStatus() {
        return taskStatus;
    }

    public void setTaskStatus(String taskStatus) {
        this.taskStatus = taskStatus;
    }

    public ArrayList<String> getTaskCollaborators() {
        return taskCollaborators;
    }

    public void setTaskCollaborators(ArrayList<String> taskCollaborators) {
        this.taskCollaborators = taskCollaborators;
    }

    public String getTaskOwner() {
        return taskOwner;
    }

    public void setTaskOwner(String taskOwner) {
        this.taskOwner = taskOwner;
    }

    public String getTaskParent() {
        return taskParent;
    }

    public void setTaskParent(String taskParent) {
        this.taskParent = taskParent;
    }

    public String getTaskOwnerName() {
        return taskOwnerName;
    }

    public void setTaskOwnerName(String taskOwnerName) {
        this.taskOwnerName = taskOwnerName;
    }

    public String getTaskOwnerDepartment() {
        return taskOwnerDepartment;
    }

    public void setTaskOwnerDepartment(String taskOwnerDepartment) {
        this.taskOwnerDepartment = taskOwnerDepartment;
    }

    
    
}
