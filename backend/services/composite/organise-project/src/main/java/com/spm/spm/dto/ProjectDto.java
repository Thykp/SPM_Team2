package com.spm.spm.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ProjectDto {
    private UUID id;
    private OffsetDateTime createdAt;
    private String title;
    private List<UUID> taskList;
    private String description;
    private UUID owner;
    private List<UUID> collaborators;

    public ProjectDto() {}

    public ProjectDto(UUID id, OffsetDateTime createdAt, String title, List<UUID> taskList, String description, UUID owner, List<UUID> collaborators) {
        this.id = id;
        this.createdAt = createdAt;
        this.title = title;
        this.taskList = taskList;
        this.description = description;
        this.owner = owner;
        this.collaborators = collaborators;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public List<UUID> getTaskList() { return taskList; }
    public void setTaskList(List<UUID> taskList) { this.taskList = taskList; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public UUID getOwner() { return owner; }
    public void setOwner(UUID owner) { this.owner = owner; }

    public List<UUID> getCollaborators() { return collaborators; }
    public void setCollaborators(List<UUID> collaborators) { this.collaborators = collaborators; }
}
