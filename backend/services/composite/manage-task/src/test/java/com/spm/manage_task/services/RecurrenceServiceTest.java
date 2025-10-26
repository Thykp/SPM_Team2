package com.spm.manage_task.services;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.spm.manage_task.dto.RecurrenceDto;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
public class RecurrenceServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private RecurrenceService recurrenceService;

    private RecurrenceDto mockRecurrenceDto;
    private Map<String, Object> mockAtomicResponse;

    @BeforeEach
    void setUp() {
        // Setup mock RecurrenceDto
        mockRecurrenceDto = new RecurrenceDto();
        mockRecurrenceDto.setId("rec123");
        mockRecurrenceDto.setTaskId("task456");
        mockRecurrenceDto.setFrequency("Week");
        mockRecurrenceDto.setInterval(1);
        mockRecurrenceDto.setEndDate("2025-12-31");

        // Setup mock atomic response (Map)
        mockAtomicResponse = new HashMap<>();
        mockAtomicResponse.put("id", "rec123");
        mockAtomicResponse.put("task_id", "task456");
        mockAtomicResponse.put("frequency", "Week");
        mockAtomicResponse.put("interval", 1);
        mockAtomicResponse.put("end_date", "2025-12-31");
        mockAtomicResponse.put("next_occurrence", "2025-11-01T00:00:00");
    }

    // ===== getRecurrenceById() Tests =====

    @Test
    void testGetRecurrenceById_Success() {
        // Arrange
        String recurrenceId = "rec123";
        when(restTemplate.exchange(
            eq("http://task:3031/recurrence/" + recurrenceId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(mockAtomicResponse, HttpStatus.OK));

        // Act
        RecurrenceDto result = recurrenceService.getRecurrenceById(recurrenceId);

        // Assert
        assertNotNull(result);
        assertEquals("rec123", result.getId());
        assertEquals("task456", result.getTaskId());
        assertEquals("Week", result.getFrequency());
        assertEquals(1, result.getInterval());
        assertEquals("2025-12-31", result.getEndDate());
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/recurrence/" + recurrenceId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        );
    }

    @Test
    void testGetRecurrenceById_NonSuccessfulStatus() {
        // Arrange
        String recurrenceId = "rec123";
        when(restTemplate.exchange(
            eq("http://task:3031/recurrence/" + recurrenceId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.BAD_REQUEST));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> recurrenceService.getRecurrenceById(recurrenceId));
        assertTrue(exception.getMessage().contains("Failed to retrieve recurrence"));
        assertTrue(exception.getMessage().contains("400"));
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/recurrence/" + recurrenceId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        );
    }

    @Test
    void testGetRecurrenceById_NullResponse() {
        // Arrange
        String recurrenceId = "rec123";
        when(restTemplate.exchange(
            eq("http://task:3031/recurrence/" + recurrenceId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> recurrenceService.getRecurrenceById(recurrenceId));
        assertTrue(exception.getMessage().contains("Recurrence not found for ID"));
        assertTrue(exception.getMessage().contains(recurrenceId));
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/recurrence/" + recurrenceId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        );
    }

    // ===== getRecurrencesByTaskId() Tests =====

    @Test
    void testGetRecurrencesByTaskId_Success() {
        // Arrange
        String taskId = "task456";
        List<Map<String, Object>> mockResponseList = List.of(mockAtomicResponse);
        when(restTemplate.exchange(
            eq("http://task:3031/recurrence/task/" + taskId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(mockResponseList, HttpStatus.OK));

        // Act
        List<RecurrenceDto> result = recurrenceService.getRecurrencesByTaskId(taskId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("rec123", result.get(0).getId());
        assertEquals("task456", result.get(0).getTaskId());
        assertEquals("Week", result.get(0).getFrequency());
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/recurrence/task/" + taskId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        );
    }

    @Test
    void testGetRecurrencesByTaskId_NonSuccessfulStatus() {
        // Arrange
        String taskId = "task456";
        when(restTemplate.exchange(
            eq("http://task:3031/recurrence/task/" + taskId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> recurrenceService.getRecurrencesByTaskId(taskId));
        assertTrue(exception.getMessage().contains("Failed to retrieve recurrences"));
        assertTrue(exception.getMessage().contains("500"));
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/recurrence/task/" + taskId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        );
    }

    @Test
    void testGetRecurrencesByTaskId_EmptyResponse() {
        // Arrange
        String taskId = "task456";
        List<Map<String, Object>> emptyList = List.of();
        when(restTemplate.exchange(
            eq("http://task:3031/recurrence/task/" + taskId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(emptyList, HttpStatus.OK));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> recurrenceService.getRecurrencesByTaskId(taskId));
        assertTrue(exception.getMessage().contains("No recurrences found for task ID"));
        assertTrue(exception.getMessage().contains(taskId));
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/recurrence/task/" + taskId),
            eq(HttpMethod.GET),
            eq(null),
            any(ParameterizedTypeReference.class)
        );
    }

    // ===== createRecurrence() Tests =====

    @Test
    void testCreateRecurrence_Success() {
        // Arrange
        when(restTemplate.postForObject(
            eq("http://task:3031/recurrence"),
            eq(mockRecurrenceDto),
            eq(Void.class)
        )).thenReturn(null);

        // Act
        assertDoesNotThrow(() -> recurrenceService.createRecurrence(mockRecurrenceDto));

        // Assert
        verify(restTemplate, times(1)).postForObject(
            eq("http://task:3031/recurrence"),
            eq(mockRecurrenceDto),
            eq(Void.class)
        );
    }

    // ===== updateRecurrence() Tests =====

    @Test
    void testUpdateRecurrence_Success() {
        // Arrange
        String recurrenceId = "rec123";
        RecurrenceDto updateDto = new RecurrenceDto();
        updateDto.setTaskId("task456");
        updateDto.setFrequency("Month");
        updateDto.setInterval(2);
        
        doNothing().when(restTemplate).put(
            eq("http://task:3031/recurrence/" + recurrenceId),
            any(RecurrenceDto.class)
        );

        // Act
        assertDoesNotThrow(() -> recurrenceService.updateRecurrence(recurrenceId, updateDto));

        // Assert
        assertEquals(recurrenceId, updateDto.getId());
        verify(restTemplate, times(1)).put(
            eq("http://task:3031/recurrence/" + recurrenceId),
            any(RecurrenceDto.class)
        );
    }

    // ===== deleteRecurrence() Tests =====

    @Test
    void testDeleteRecurrence_Success() {
        // Arrange
        String recurrenceId = "rec123";
        doNothing().when(restTemplate).delete(eq("http://task:3031/recurrence/" + recurrenceId));

        // Act
        assertDoesNotThrow(() -> recurrenceService.deleteRecurrence(recurrenceId));

        // Assert
        verify(restTemplate, times(1)).delete(eq("http://task:3031/recurrence/" + recurrenceId));
    }
}

