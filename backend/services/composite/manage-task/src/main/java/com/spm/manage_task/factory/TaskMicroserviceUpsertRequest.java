package com.spm.manage_task.factory;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TaskMicroserviceUpsertRequest {

    @JsonProperty("priority")
    private int taskPriority;
    
    private String taskId;

    @JsonProperty("parent_task_id")
    private String parentTaskId;

    @JsonProperty("project_id")
    private String projectId;

    @JsonProperty("title")
    private String title;

    @JsonProperty("deadline")
    private String deadline;

    @JsonProperty("description")
    private String description;

    @JsonProperty("status")
    private String status;

    @JsonProperty("participants")
    private List<Participant> participants;

    public TaskMicroserviceUpsertRequest(String parentTaskId, String projectId, String title, String deadline,
            String description, String status, List<Participant> participants, int taskPriority) {
        this.parentTaskId = parentTaskId;
        this.projectId = projectId;
        this.title = title;
        this.deadline = deadline;
        this.description = description;
        this.status = status;
        this.participants = participants;
        this.taskPriority = taskPriority;
    }

    public int getTaskPriority() {
        return taskPriority;
    }

    public void setTaskPriority(int taskPriority) {
        this.taskPriority = taskPriority;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<Participant> getParticipants() {
        return participants;
    }

    public void setParticipants(List<Participant> participants) {
        this.participants = participants;
    }

    @Override
    public String toString() {
        return "TaskMicroserviceUpsertRequest{" +
                "parentTaskId='" + parentTaskId + '\'' +
                ", projectId='" + projectId + '\'' +
                ", title='" + title + '\'' +
                ", deadline='" + deadline + '\'' +
                ", description='" + description + '\'' +
                ", status='" + status + '\'' +
                ", participants=" + participants +
                '}';
    }




}
