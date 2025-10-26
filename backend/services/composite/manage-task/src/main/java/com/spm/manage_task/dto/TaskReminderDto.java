package com.spm.manage_task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class TaskReminderDto {
    @JsonProperty("task_id")
    private String taskId;

    @JsonProperty("deadline_reminder")
    private List<Integer> deadlineReminder;

    public TaskReminderDto() {}

    public TaskReminderDto(String taskId, List<Integer> deadlineReminder, String userId) {
        this.taskId = taskId;
        this.deadlineReminder = deadlineReminder;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }


    public List<Integer> getDeadlineReminder() {
        return deadlineReminder;
    }

    public void setDeadlineReminder(List<Integer> deadlineReminder) {
        this.deadlineReminder = deadlineReminder;
    }
}
