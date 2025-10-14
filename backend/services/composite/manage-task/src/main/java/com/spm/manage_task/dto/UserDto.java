package com.spm.manage_task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UserDto {

    @JsonProperty("id")
    private String userId;

    @JsonProperty("department_id")
    private String userDepartmentId;

    @JsonProperty("team_id")
    private String userTeamId;

    @JsonProperty("display_name")
    private String userDisplayName;

    @JsonProperty("role")
    private String userRole;

    @JsonProperty("department_name")
    private String userDepartmentName;

    @JsonProperty("team_name")
    private String userTeamName;

    public UserDto(String userId, String userDepartmentId, String userTeamId, String userDisplayName, String userRole,
            String userDepartmentName, String userTeamName) {
        this.userId = userId;
        this.userDepartmentId = userDepartmentId;
        this.userTeamId = userTeamId;
        this.userDisplayName = userDisplayName;
        this.userRole = userRole;
        this.userDepartmentName = userDepartmentName;
        this.userTeamName = userTeamName;
    }

    @Override
    public String toString() {
        return "UserDto{" +
                "userId='" + userId + '\'' +
                ", userDepartmentId='" + userDepartmentId + '\'' +
                ", userTeamId='" + userTeamId + '\'' +
                ", userDisplayName='" + userDisplayName + '\'' +
                ", userRole='" + userRole + '\'' +
                ", userDepartmentName='" + userDepartmentName + '\'' +
                ", userTeamName='" + userTeamName + '\'' +
                '}';
    }

    public String getUserId() {
        return userId;
    }

    public String getUserDepartmentId() {
        return userDepartmentId;
    }

    public String getUserTeamId() {
        return userTeamId;
    }

    public String getUserDisplayName() {
        return userDisplayName;
    }

    public String getUserRole() {
        return userRole;
    }

    public String getUserDepartmentName() {
        return userDepartmentName;
    }

    public String getUserTeamName() {
        return userTeamName;
    }

    
}