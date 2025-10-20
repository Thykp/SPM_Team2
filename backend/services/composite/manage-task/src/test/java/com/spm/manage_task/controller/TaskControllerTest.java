package com.spm.manage_task.controller;

import java.util.ArrayList;
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
import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.services.TaskService;

@WebMvcTest(TaskController.class)
public class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/task/ ====================

    @Test
    void getAllTasks_ShouldReturnTaskList() throws Exception {
        ArrayList<String> collaborators1 = new ArrayList<>();
        collaborators1.add("user2");

        TaskDto task1 = new TaskDto(
            "task1",
            "Task 1",
            "project1",
            "2024-12-31",
            "Description 1",
            "To Do",
            collaborators1,
            "user1",
            null,
            "John Doe",
            "Engineering",
            5
        );

        ArrayList<String> collaborators2 = new ArrayList<>();
        collaborators2.add("user3");

        TaskDto task2 = new TaskDto(
            "task2",
            "Task 2",
            "project1",
            "2024-12-25",
            "Description 2",
            "In Progress",
            collaborators2,
            "user2",
            null,
            "Jane Smith",
            "Marketing",
            5
        );

        List<TaskDto> mockTasks = Arrays.asList(task1, task2);

        when(taskService.getAllTasks()).thenReturn(mockTasks);

        mockMvc.perform(get("/api/task/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Task 1"))
                .andExpect(jsonPath("$[1].title").value("Task 2"));
    }

    @Test
    void getAllTasks_ShouldReturnEmptyList() throws Exception {
        when(taskService.getAllTasks()).thenReturn(List.of());

        mockMvc.perform(get("/api/task/"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ==================== GET /api/task/{userId} ====================

    @Test
    void getUserTasks_ShouldReturnUserTasks() throws Exception {
        String userId = "user1";
        
        ArrayList<String> collaborators = new ArrayList<>();
        collaborators.add("user2");

        TaskDto task1 = new TaskDto(
            "task1",
            "User Task 1",
            "project1",
            "2024-12-31",
            "Description",
            "To Do",
            collaborators,
            userId,
            null,
            "John Doe",
            "Engineering",
            5
        );

        List<TaskDto> mockTasks = List.of(task1);

        when(taskService.getUserTask(userId)).thenReturn(mockTasks);

        mockMvc.perform(get("/api/task/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("User Task 1"))
                .andExpect(jsonPath("$[0].owner").value(userId));
    }

    @Test
    void getUserTasks_ShouldReturnEmptyList_WhenNoTasks() throws Exception {
        String userId = "user1";

        when(taskService.getUserTask(userId)).thenReturn(List.of());

        mockMvc.perform(get("/api/task/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ==================== POST /api/task/new ====================

    @Test
    void createTask_ShouldReturnSuccess() throws Exception {
        ArrayList<String> collaborators = new ArrayList<>();
        collaborators.add("user2");

        TaskPostRequestDto newTask = new TaskPostRequestDto(
            "New Task",
            "2024-12-31",
            "project1",
            "Task description",
            "To Do",
            collaborators,
            "user1",
            null,
            5
        );

        doNothing().when(taskService).createTask(any(TaskPostRequestDto.class));

        mockMvc.perform(post("/api/task/new")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTask)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task created successfully"));
    }

    @Test
    void createTask_WithParentTask_ShouldReturnSuccess() throws Exception {
        ArrayList<String> collaborators = new ArrayList<>();
        collaborators.add("user2");

        TaskPostRequestDto newSubTask = new TaskPostRequestDto(
            "Sub Task",
            "2024-12-31",
            "project1",
            "Subtask description",
            "To Do",
            collaborators,
            "user1",
            "parentTask123",
            5
        );

        doNothing().when(taskService).createTask(any(TaskPostRequestDto.class));

        mockMvc.perform(post("/api/task/new")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newSubTask)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task created successfully"));
    }

    // ==================== GET /api/task/id/{taskId} ====================

    @Test
    void getTaskById_ShouldReturnTask_WhenTaskExists() throws Exception {
        String taskId = "task123";
        
        ArrayList<String> collaborators = new ArrayList<>();
        collaborators.add("user2");

        TaskDto mockTask = new TaskDto(
            taskId,
            "Sample Task",
            "project1",
            "2024-12-31",
            "Task description",
            "In Progress",
            collaborators,
            "user1",
            null,
            "John Doe",
            "Engineering",
            5
        );

        when(taskService.getTaskByIdWithOwner(taskId)).thenReturn(mockTask);

        mockMvc.perform(get("/api/task/id/{taskId}", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId))
                .andExpect(jsonPath("$.title").value("Sample Task"))
                .andExpect(jsonPath("$.status").value("In Progress"))
                .andExpect(jsonPath("$.ownerName").value("John Doe"));
    }

    // ==================== PUT /api/task/edit/{taskId} ====================

    @Test
    void updateTask_ShouldReturnSuccess() throws Exception {
        String taskId = "task123";
        
        ArrayList<String> collaborators = new ArrayList<>();
        collaborators.add("user2");
        collaborators.add("user3");

        TaskPostRequestDto updateRequest = new TaskPostRequestDto(
            "Updated Task",
            "2024-12-31",
            "project1",
            "Updated description",
            "Done",
            collaborators,
            "user1",
            null,
            5
        );

        doNothing().when(taskService).updateTask(eq(taskId), any(TaskPostRequestDto.class));

        mockMvc.perform(put("/api/task/edit/{taskId}", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task updated successfully"));
    }

    @Test
    void updateTask_ChangeStatus_ShouldReturnSuccess() throws Exception {
        String taskId = "task123";
        
        ArrayList<String> collaborators = new ArrayList<>();
        collaborators.add("user2");

        TaskPostRequestDto updateRequest = new TaskPostRequestDto(
            "Task Title",
            "2024-12-31",
            "project1",
            "Description",
            "Done",
            collaborators,
            "user1",
            null,
            5
        );

        doNothing().when(taskService).updateTask(eq(taskId), any(TaskPostRequestDto.class));

        mockMvc.perform(put("/api/task/edit/{taskId}", taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("Task updated successfully"));
    }

    // ==================== GET /api/task/subtask/{taskId} ====================

    @Test
    void getSubTaskByTaskId_ShouldReturnSubtasks() throws Exception {
        String parentTaskId = "task123";
        
        ArrayList<String> collaborators1 = new ArrayList<>();
        collaborators1.add("user2");

        TaskDto subtask1 = new TaskDto(
            "subtask1",
            "Subtask 1",
            "project1",
            "2024-12-31",
            "Subtask description 1",
            "To Do",
            collaborators1,
            "user1",
            parentTaskId,
            "John Doe",
            "Engineering",
            5
        );

        ArrayList<String> collaborators2 = new ArrayList<>();
        collaborators2.add("user3");

        TaskDto subtask2 = new TaskDto(
            "subtask2",
            "Subtask 2",
            "project1",
            "2024-12-25",
            "Subtask description 2",
            "In Progress",
            collaborators2,
            "user2",
            parentTaskId,
            "Jane Smith",
            "Marketing",
            5
        );

        List<TaskDto> mockSubtasks = Arrays.asList(subtask1, subtask2);

        when(taskService.getSubTaskByTaskId(parentTaskId)).thenReturn(mockSubtasks);

        mockMvc.perform(get("/api/task/subtask/{taskId}", parentTaskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Subtask 1"))
                .andExpect(jsonPath("$[0].parent").value(parentTaskId))
                .andExpect(jsonPath("$[1].title").value("Subtask 2"));
    }

    @Test
    void getSubTaskByTaskId_ShouldReturnEmptyList_WhenNoSubtasks() throws Exception {
        String taskId = "task123";

        when(taskService.getSubTaskByTaskId(taskId)).thenReturn(List.of());

        mockMvc.perform(get("/api/task/subtask/{taskId}", taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ==================== DELETE /api/task/{taskId} ====================

    @Test
    void deleteTask_ShouldReturnSuccess() throws Exception {
        String taskId = "task123";

        doNothing().when(taskService).deleteTask(taskId);

        mockMvc.perform(delete("/api/task/{taskId}", taskId))
                .andExpect(status().isOk())
                .andExpect(content().string("Task deleted successfully"));
    }

    @Test
    void deleteTask_WithValidTaskId_ShouldReturnSuccess() throws Exception {
        String taskId = "validTask456";

        doNothing().when(taskService).deleteTask(taskId);

        mockMvc.perform(delete("/api/task/{taskId}", taskId))
                .andExpect(status().isOk())
                .andExpect(content().string("Task deleted successfully"));
    }

    @Test
    void deleteTask_ShouldCallServiceOnce() throws Exception {
        String taskId = "task789";

        doNothing().when(taskService).deleteTask(taskId);

        mockMvc.perform(delete("/api/task/{taskId}", taskId))
                .andExpect(status().isOk());

        // Verify that the service method was called exactly once
        verify(taskService, times(1)).deleteTask(taskId);
    }
}
