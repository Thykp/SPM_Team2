package com.spm.manage_task.factory;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Participant {

    @JsonProperty("is_owner")
    private boolean isOwner;

    @JsonProperty("profile_id")
    private String profileId;


    public Participant(boolean isOwner, String profileId) {
        this.isOwner = isOwner;
        this.profileId = profileId;
    }

    public boolean getIsOwner() {
        return isOwner;
    }

    public void setOwner(boolean isOwner) {
        this.isOwner = isOwner;
    }

    public String getProfileId() {
        return profileId;
    }

    public void setProfileId(String profileId) {
        this.profileId = profileId;
    }

    @Override
    public String toString() {
        return "Participant{" +
                "isOwner=" + isOwner +
                ", profileId='" + profileId + '\'' +
                '}';
    }

}
