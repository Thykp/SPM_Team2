package com.spm.manage_task.controller;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spm.manage_task.dto.RecurrenceDto;
import com.spm.manage_task.services.RecurrenceService;

@WebMvcTest(RecurrenceController.class)
public class RecurrenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RecurrenceService recurrenceService;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/recurrence/{recurrenceId} ====================

    @Test
    void getRecurrenceById_ShouldReturnRecurrence() throws Exception {
        RecurrenceDto recurrence = new RecurrenceDto();
        recurrence.setId("rec123");
        recurrence.setTaskId("task456");
        recurrence.setFrequency("Week");
        recurrence.setInterval(1);
        recurrence.setEndDate("2025-12-31");

        when(recurrenceService.getRecurrenceById("rec123")).thenReturn(recurrence);

        mockMvc.perform(get("/api/recurrence/rec123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("rec123"))
                .andExpect(jsonPath("$.task_id").value("task456"))
                .andExpect(jsonPath("$.frequency").value("Week"))
                .andExpect(jsonPath("$.interval").value(1))
                .andExpect(jsonPath("$.end_date").value("2025-12-31"));

        verify(recurrenceService, times(1)).getRecurrenceById("rec123");
    }

    // ==================== GET /api/recurrence/task/{taskId} ====================

    @Test
    void getRecurrencesByTaskId_ShouldReturnRecurrenceList() throws Exception {
        RecurrenceDto recurrence1 = new RecurrenceDto();
        recurrence1.setId("rec1");
        recurrence1.setTaskId("task456");
        recurrence1.setFrequency("Week");
        recurrence1.setInterval(1);

        RecurrenceDto recurrence2 = new RecurrenceDto();
        recurrence2.setId("rec2");
        recurrence2.setTaskId("task456");
        recurrence2.setFrequency("Day");
        recurrence2.setInterval(2);

        List<RecurrenceDto> mockRecurrences = Arrays.asList(recurrence1, recurrence2);

        when(recurrenceService.getRecurrencesByTaskId("task456")).thenReturn(mockRecurrences);

        mockMvc.perform(get("/api/recurrence/task/task456"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value("rec1"))
                .andExpect(jsonPath("$[0].frequency").value("Week"))
                .andExpect(jsonPath("$[1].id").value("rec2"))
                .andExpect(jsonPath("$[1].frequency").value("Day"));

        verify(recurrenceService, times(1)).getRecurrencesByTaskId("task456");
    }

    // ==================== POST /api/recurrence/ ====================

    @Test
    void createRecurrence_ShouldReturn201() throws Exception {
        RecurrenceDto newRecurrence = new RecurrenceDto();
        newRecurrence.setTaskId("task456");
        newRecurrence.setFrequency("Month");
        newRecurrence.setInterval(1);
        newRecurrence.setEndDate("2026-12-31");

        doNothing().when(recurrenceService).createRecurrence(any(RecurrenceDto.class));

        mockMvc.perform(post("/api/recurrence/")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newRecurrence)))
                .andExpect(status().isCreated())
                .andExpect(content().string("Recurrence created successfully"));

        verify(recurrenceService, times(1)).createRecurrence(any(RecurrenceDto.class));
    }

    // ==================== PUT /api/recurrence/{recurrenceId} ====================

    @Test
    void updateRecurrence_ShouldReturn200() throws Exception {
        RecurrenceDto updatedRecurrence = new RecurrenceDto();
        updatedRecurrence.setFrequency("Day");
        updatedRecurrence.setInterval(3);
        updatedRecurrence.setEndDate("2027-01-01");

        doNothing().when(recurrenceService).updateRecurrence(eq("rec123"), any(RecurrenceDto.class));

        mockMvc.perform(put("/api/recurrence/rec123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatedRecurrence)))
                .andExpect(status().isOk())
                .andExpect(content().string("Recurrence updated successfully"));

        verify(recurrenceService, times(1)).updateRecurrence(eq("rec123"), any(RecurrenceDto.class));
    }

    // ==================== DELETE /api/recurrence/{recurrenceId} ====================

    @Test
    void deleteRecurrence_ShouldReturn200() throws Exception {
        doNothing().when(recurrenceService).deleteRecurrence("rec123");

        mockMvc.perform(delete("/api/recurrence/rec123"))
                .andExpect(status().isOk())
                .andExpect(content().string("Recurrence deleted successfully"));

        verify(recurrenceService, times(1)).deleteRecurrence("rec123");
    }

}

