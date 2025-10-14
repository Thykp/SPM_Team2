package com.spm.spm.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CollaboratorDto {
    @JsonProperty("profile_id")
    private UUID profileId;

    @JsonProperty("is_owner")
    private Boolean isOwner;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    // Constructors
    public CollaboratorDto() {}

    public CollaboratorDto(UUID profileId, Boolean isOwner, OffsetDateTime createdAt) {
        this.profileId = profileId;
        this.isOwner = isOwner;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public UUID getProfileId() {
        return profileId;
    }

    public void setProfileId(UUID profileId) {
        this.profileId = profileId;
    }

    public Boolean getIsOwner() {
        return isOwner;
    }

    public void setIsOwner(Boolean isOwner) {
        this.isOwner = isOwner;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}