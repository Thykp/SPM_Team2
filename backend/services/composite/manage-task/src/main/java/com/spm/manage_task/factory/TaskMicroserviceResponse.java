package com.spm.manage_task.factory;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TaskMicroserviceResponse {
    @JsonProperty("id")
    private String taskId;

    @JsonProperty("parent_task_id")
    private String parentTaskId;

    @JsonProperty("project_id")
    private String projectId;

    @JsonProperty("title")
    private String taskTitle;

    @JsonProperty("deadline")
    private String taskDeadline;

    @JsonProperty("description")
    private String taskDescription;

    @JsonProperty("status")
    private String taskStatus;

    @JsonProperty("created_at")
    private String taskCreatedAt;

    @JsonProperty("updated_at")
    private String taskUpdatedAt;

    @JsonProperty("participants")
    private List<Participant> taskParticipants;

    public TaskMicroserviceResponse() {}

    public TaskMicroserviceResponse(String taskId, String parentTaskId, String projectId, String taskTitle,
            String taskDeadline, String taskDescription, String taskStatus, String taskCreatedAt, String taskUpdatedAt,
            List<Participant> taskParticipants) {
        this.taskId = taskId;
        this.parentTaskId = parentTaskId;
        this.projectId = projectId;
        this.taskTitle = taskTitle;
        this.taskDeadline = taskDeadline;
        this.taskDescription = taskDescription;
        this.taskStatus = taskStatus;
        this.taskCreatedAt = taskCreatedAt;
        this.taskUpdatedAt = taskUpdatedAt;
        this.taskParticipants = taskParticipants;
    }

    @Override
    public String toString() {
        return "TaskMicroserviceResponse{" +
                "taskId='" + taskId + '\'' +
                ", parentTaskId='" + parentTaskId + '\'' +
                ", projectId='" + projectId + '\'' +
                ", taskTitle='" + taskTitle + '\'' +
                ", taskDeadline='" + taskDeadline + '\'' +
                ", taskDescription='" + taskDescription + '\'' +
                ", taskStatus='" + taskStatus + '\'' +
                ", taskCreatedAt='" + taskCreatedAt + '\'' +
                ", taskUpdatedAt='" + taskUpdatedAt + '\'' +
                ", taskParticipants=" + taskParticipants +
                '}';
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getParentTaskId() {
        return parentTaskId;
    }

    public void setParentTaskId(String parentTaskId) {
        this.parentTaskId = parentTaskId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
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

    public String getTaskCreatedAt() {
        return taskCreatedAt;
    }

    public void setTaskCreatedAt(String taskCreatedAt) {
        this.taskCreatedAt = taskCreatedAt;
    }

    public String getTaskUpdatedAt() {
        return taskUpdatedAt;
    }

    public void setTaskUpdatedAt(String taskUpdatedAt) {
        this.taskUpdatedAt = taskUpdatedAt;
    }

    public List<Participant> getTaskParticipants() {
        return taskParticipants;
    }

    public void setTaskParticipants(List<Participant> taskParticipants) {
        this.taskParticipants = taskParticipants;
    }
}
