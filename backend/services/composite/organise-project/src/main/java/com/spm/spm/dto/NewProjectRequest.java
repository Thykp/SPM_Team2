package com.spm.spm.dto;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NewProjectRequest {
    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("ownerId")
    private UUID ownerId;

    @JsonProperty("collaborators")
    private List<UUID> collaborators;

    // Constructors
    public NewProjectRequest() {}

    public NewProjectRequest(String title, String description, UUID ownerId) {
        this.title = title;
        this.description = description;
        this.ownerId = ownerId;
        this.collaborators = collaborators;

    }

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }
    
    public List<UUID> getCollaborators() {
        return collaborators; 
    }

    public void setCollaborators(List<UUID> collaborators) {
        this.collaborators = collaborators; 
    }
}