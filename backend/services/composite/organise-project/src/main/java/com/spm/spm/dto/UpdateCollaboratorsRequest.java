package com.spm.spm.dto;

import java.util.List;
import java.util.UUID;

public class UpdateCollaboratorsRequest {
    private List<UUID> collaborators;

    public UpdateCollaboratorsRequest() {}

    public UpdateCollaboratorsRequest(List<UUID> collaborators) {
        this.collaborators = collaborators;
    }

    public List<UUID> getCollaborators() { return collaborators; }
    public void setCollaborators(List<UUID> collaborators) { this.collaborators = collaborators; }
}
