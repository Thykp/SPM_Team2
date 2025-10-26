package com.spm.manage_task.factory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import com.spm.manage_task.dto.RecurrenceDto;

public class Recurrence {
    public static RecurrenceDto fromAtomicResponse(Map<String, Object> response) {
        RecurrenceDto recurrence = new RecurrenceDto();
        recurrence.setId((String) response.get("id"));
        recurrence.setTaskId((String) response.get("task_id"));
        recurrence.setFrequency((String) response.get("frequency"));
        recurrence.setInterval((Integer) response.get("interval"));

        // Convert next_occurrence from String to LocalDateTime
        String nextOccurrenceStr = (String) response.get("next_occurrence");
        if (nextOccurrenceStr != null) {
            recurrence.setNextOccurrence(LocalDateTime.parse(nextOccurrenceStr, DateTimeFormatter.ISO_DATE_TIME));
        }

        // Convert end_date from String to String (no parsing needed)
        String endDateStr = (String) response.get("end_date");
        if (endDateStr != null) {
            recurrence.setEndDate(endDateStr); // Directly set the string
        }

        return recurrence;
    }
}