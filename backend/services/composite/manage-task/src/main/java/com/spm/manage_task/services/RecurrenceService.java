package com.spm.manage_task.services;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.spm.manage_task.dto.RecurrenceDto;
import com.spm.manage_task.factory.Recurrence;

@Service
public class RecurrenceService {

    private final String recurrenceUrl = "http://task:3031/recurrence";

    @Autowired
    private RestTemplate restTemplate;

    // Get a specific recurrence by ID
    public RecurrenceDto getRecurrenceById(String recurrenceId) {
        String url = recurrenceUrl + "/" + recurrenceId;

        // Use ParameterizedTypeReference for type safety
        ResponseEntity<Map<String, Object>> responseEntity = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        if (!responseEntity.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to retrieve recurrence. Status code: " + responseEntity.getStatusCode());
        }

        Map<String, Object> response = responseEntity.getBody();
        if (response == null) {
            throw new RuntimeException("Recurrence not found for ID: " + recurrenceId);
        }

        return Recurrence.fromAtomicResponse(response);
    }

    // Get all recurrences for a specific task
    public List<RecurrenceDto> getRecurrencesByTaskId(String taskId) {
        String url = recurrenceUrl + "/task/" + taskId;

        // Use ParameterizedTypeReference for type safety
        ResponseEntity<List<Map<String, Object>>> responseEntity = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );

        if (!responseEntity.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to retrieve recurrences. Status code: " + responseEntity.getStatusCode());
        }

        List<Map<String, Object>> response = responseEntity.getBody();
        if (response == null || response.isEmpty()) {
            throw new RuntimeException("No recurrences found for task ID: " + taskId);
        }

        return response.stream()
                .map(Recurrence::fromAtomicResponse)
                .collect(Collectors.toList());
    }

    // Create a new recurrence
    public void createRecurrence(RecurrenceDto recurrenceDto) {
        System.out.println("Recurrence DTO: " + recurrenceDto);
        
        String url = recurrenceUrl;
        restTemplate.postForObject(url, recurrenceDto, Void.class);
    }

    // Update an existing recurrence
    public void updateRecurrence(String recurrenceId, RecurrenceDto recurrenceDto) {
        System.out.println("Recurrence ID: " + recurrenceId);
        System.out.println("Recurrence DTO: " + recurrenceDto);

        recurrenceDto.setId(recurrenceId);
        System.out.println("Recurrence DTO being sent to atomic service: " + recurrenceDto);
        String url = recurrenceUrl + "/" + recurrenceId;
        restTemplate.put(url, recurrenceDto);
    }

    // Delete a recurrence by ID
    public void deleteRecurrence(String recurrenceId) {
        String url = recurrenceUrl + "/" + recurrenceId;
        restTemplate.delete(url);
    }
}