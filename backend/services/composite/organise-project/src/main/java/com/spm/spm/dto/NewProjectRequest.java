package com.spm.spm.dto;

import java.util.List;
import java.util.UUID;

public class NewProjectRequest {
    private String title;
    private String description;
    private List<UUID> taskList;
    private UUID owner;
    private List<UUID> collaborators;

    public NewProjectRequest() {}

    public NewProjectRequest(String title, String description, List<UUID> taskList, UUID owner, List<UUID> collaborators) {
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
