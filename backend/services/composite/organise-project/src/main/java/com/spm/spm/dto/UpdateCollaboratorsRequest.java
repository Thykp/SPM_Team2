package com.spm.spm.dto;

import java.util.List;

public class UpdateCollaboratorsRequest {
    private List<String> collaborators;

    public UpdateCollaboratorsRequest() {}

    public UpdateCollaboratorsRequest(List<String> collaborators) {
        this.collaborators = collaborators;
    }

    public List<String> getCollaborators() { return collaborators; }
    public void setCollaborators(List<String> collaborators) { this.collaborators = collaborators; }
}
