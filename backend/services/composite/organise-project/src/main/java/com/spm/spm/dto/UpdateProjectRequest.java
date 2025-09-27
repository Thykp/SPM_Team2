package com.spm.spm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.UUID;

public class UpdateProjectRequest {
    @JsonProperty("title")
    private String title;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("tasklist")
    private List<UUID> taskList;
    
    @JsonProperty("owner")
    private UUID owner;
    
    @JsonProperty("collaborators")
    private List<UUID> collaborators;

    public UpdateProjectRequest() {}

    public UpdateProjectRequest(String title, String description, List<UUID> taskList, UUID owner, List<UUID> collaborators) {
        this.title = title;
        this.description = description;
        this.taskList = taskList;
        this.owner = owner;
        this.collaborators = collaborators;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<UUID> getTaskList() { return taskList; }
    public void setTaskList(List<UUID> taskList) { this.taskList = taskList; }

    public UUID getOwner() { return owner; }
    public void setOwner(UUID owner) { this.owner = owner; }

    public List<UUID> getCollaborators() { return collaborators; }
    public void setCollaborators(List<UUID> collaborators) { this.collaborators = collaborators; }
}