package com.spm.manage_task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserDto {

    @JsonProperty("id")
    private String userId;

    @JsonProperty("display_name")
    private String displayName;

    @JsonProperty("department")
    private String department;

    public UserDto(String userId, String displayName, String department) {
        this.userId = userId;
        this.displayName = displayName;
        this.department = department;
    }

    public String getUserId() {
        return userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDepartment() {
        return department;
    }

    @Override
    public String toString() {
        return "UserDto{" +
                "userId='" + userId + '\'' +
                ", displayName='" + displayName + '\'' +
                ", department='" + department + '\'' +
                '}';
    }
}