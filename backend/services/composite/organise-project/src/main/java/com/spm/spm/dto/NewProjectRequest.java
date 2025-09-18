package com.spm.spm.dto;

import java.util.List;

public class NewProjectRequest {
    private String name;
    private String description;
    private List<String> collaborators;

    public NewProjectRequest() {}

    public NewProjectRequest(String name, String description, List<String> collaborators) {
        this.name = name;
        this.description = description;
        this.collaborators = collaborators;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getCollaborators() { return collaborators; }
    public void setCollaborators(List<String> collaborators) { this.collaborators = collaborators; }
}
