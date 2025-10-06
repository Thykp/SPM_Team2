package com.spm.spm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateProjectRequest {
    @JsonProperty("title")
    private String title;
    
    @JsonProperty("description")
    private String description;

    public UpdateProjectRequest() {}

    public UpdateProjectRequest(String title, String description) {
        this.title = title;
        this.description = description;
    }

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
}