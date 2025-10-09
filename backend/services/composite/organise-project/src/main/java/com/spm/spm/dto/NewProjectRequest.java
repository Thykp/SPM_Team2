package com.spm.spm.dto;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NewProjectRequest {
    @JsonProperty("title")
    private String title;

    @JsonProperty("description")
    private String description;

    @JsonProperty("ownerId")
    private UUID ownerId;

    // Constructors
    public NewProjectRequest() {}

    public NewProjectRequest(String title, String description, UUID ownerId) {
        this.title = title;
        this.description = description;
        this.ownerId = ownerId;
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
}