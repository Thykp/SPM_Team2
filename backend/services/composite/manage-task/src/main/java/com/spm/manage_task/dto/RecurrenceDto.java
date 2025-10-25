package com.spm.manage_task.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RecurrenceDto {
    @JsonProperty("id")
    private String id;

    @JsonProperty("task_id")
    private String task_id;

    @JsonProperty("frequency")
    private String frequency; // Enum: Day, Week, Month

    @JsonProperty("interval")
    private int interval;

    @JsonProperty("nextOccurrence")
    private LocalDateTime nextOccurrence;

    @JsonProperty("end_date")
    private String end_date;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTaskId() {
        return task_id;
    }

    public void setTaskId(String taskId) {
        this.task_id = taskId;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public int getInterval() {
        return interval;
    }

    public void setInterval(int interval) {
        this.interval = interval;
    }

    public LocalDateTime getNextOccurrence() {
        return nextOccurrence;
    }

    public void setNextOccurrence(LocalDateTime nextOccurrence) {
        this.nextOccurrence = nextOccurrence;
    }

    public String getEndDate() {
        return end_date;
    }

    public void setEndDate(String endDate) {
        this.end_date = endDate;
    }
}