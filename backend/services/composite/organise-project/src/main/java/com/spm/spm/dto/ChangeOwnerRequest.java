package com.spm.spm.dto;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ChangeOwnerRequest {
    @JsonProperty("new_owner_id")
    private UUID newOwnerId;

    public ChangeOwnerRequest() {}

    public ChangeOwnerRequest(UUID newOwnerId) {
        this.newOwnerId = newOwnerId;
    }

    public UUID getNewOwnerId() {
        return newOwnerId;
    }

    public void setNewOwnerId(UUID newOwnerId) {
        this.newOwnerId = newOwnerId;
    }
}