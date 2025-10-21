package com.spm.manage_task.services;

import java.util.ArrayList;
import java.util.List;

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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.spm.manage_task.components.TaskDTOWrapperComponent;
import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.factory.Participant;
import com.spm.manage_task.factory.TaskMicroserviceResponse;
import com.spm.manage_task.factory.TaskMicroserviceUpsertRequest;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private TaskDTOWrapperComponent taskDTOWrapper;

    @InjectMocks
    private TaskService taskService;

    private TaskMicroserviceResponse mockTaskResponse;
    private TaskDto mockTaskDto;
    private TaskPostRequestDto mockTaskPostRequest;
    private TaskMicroserviceUpsertRequest mockUpsertRequest;

    @BeforeEach
    void setUp() {
        // Setup mock TaskMicroserviceResponse
        List<Participant> participants = new ArrayList<>();
        participants.add(new Participant(true, "user1"));  // owner
        participants.add(new Participant(false, "user2")); // collaborator

        mockTaskResponse = new TaskMicroserviceResponse(
            "task123",                  // taskId
            null,                       // parentTaskId
            "project456",               // projectId
            "Sample Task",              // taskTitle
            "2024-12-31",              // taskDeadline
            "This is a sample task",   // taskDescription
            "In Progress",             // taskStatus
            "2024-01-01T00:00:00Z",    // taskCreatedAt
            "2024-01-02T00:00:00Z",    // taskUpdatedAt
            participants,               // taskParticipants
            5
        );

        // Setup mock TaskDto
        ArrayList<String> collaborators = new ArrayList<>();
        collaborators.add("user2");

        mockTaskDto = new TaskDto(
            "task123",                  // taskId
            "Sample Task",              // taskTitle
            "project456",               // taskProjectId
            "2024-12-31",              // taskDeadline
            "This is a sample task",   // taskDescription
            "In Progress",             // taskStatus
            collaborators,              // taskCollaborators
            "user1",                    // taskOwner
            null,                       // taskParent
            "John Doe",                 // taskOwnerName
            "Engineering",              // taskOwnerDepartment
            5
        );

        // Setup mock TaskPostRequestDto
        ArrayList<String> postCollaborators = new ArrayList<>();
        postCollaborators.add("user2");

        mockTaskPostRequest = new TaskPostRequestDto(
            "New Task",                 // title
            "2024-12-31",              // deadline
            "project456",               // projectId
            "Task description",         // description
            "To Do",                    // status
            postCollaborators,          // collaborators
            "user1",                    // owner
            null,                       // parent
            5
        );

        // Setup mock TaskMicroserviceUpsertRequest
        List<Participant> upsertParticipants = new ArrayList<>();
        upsertParticipants.add(new Participant(true, "user1"));  // owner
        upsertParticipants.add(new Participant(false, "user2")); // collaborator

        mockUpsertRequest = new TaskMicroserviceUpsertRequest(
            null,                       // parentTaskId
            "project456",               // projectId
            "New Task",                 // title
            "2024-12-31",              // deadline
            "Task description",         // description
            "To Do",                    // status
            upsertParticipants,         // participants
            5
        );
    }

    // ===== getAllTasks() Tests =====

    @Test
    void testGetAllTasks_Success() {
        // Arrange
        TaskMicroserviceResponse[] mockResponses = new TaskMicroserviceResponse[]{mockTaskResponse};
        List<TaskDto> expectedDtos = List.of(mockTaskDto);

        when(restTemplate.getForEntity(eq("http://task:3031/task/"), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(mockResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(mockResponses)).thenReturn(expectedDtos);

        // Act
        List<TaskDto> result = taskService.getAllTasks();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("task123", result.get(0).getTaskId());
        assertEquals("Sample Task", result.get(0).getTaskTitle());
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/"), eq(TaskMicroserviceResponse[].class));
        verify(taskDTOWrapper, times(1)).toTaskDtoList(mockResponses);
    }

    @Test
    void testGetAllTasks_EmptyList() {
        // Arrange
        TaskMicroserviceResponse[] emptyResponses = new TaskMicroserviceResponse[]{};
        List<TaskDto> emptyDtos = List.of();

        when(restTemplate.getForEntity(eq("http://task:3031/task/"), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(emptyResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(emptyResponses)).thenReturn(emptyDtos);

        // Act
        List<TaskDto> result = taskService.getAllTasks();

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/"), eq(TaskMicroserviceResponse[].class));
    }

    // ===== getUserTask() Tests =====

    @Test
    void testGetUserTask_Success() {
        // Arrange
        String userId = "user1";
        TaskMicroserviceResponse[] mockResponses = new TaskMicroserviceResponse[]{mockTaskResponse};
        List<TaskDto> expectedDtos = List.of(mockTaskDto);

        when(restTemplate.getForEntity(eq("http://task:3031/task/users/" + userId), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(mockResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(mockResponses)).thenReturn(expectedDtos);

        // Act
        List<TaskDto> result = taskService.getUserTask(userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("task123", result.get(0).getTaskId());
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/users/" + userId), eq(TaskMicroserviceResponse[].class));
        verify(taskDTOWrapper, times(1)).toTaskDtoList(mockResponses);
    }

    @Test
    void testGetUserTask_NullResponse() {
        // Arrange
        String userId = "user1";
        TaskMicroserviceResponse[] mockResponses = new TaskMicroserviceResponse[]{mockTaskResponse};

        when(restTemplate.getForEntity(eq("http://task:3031/task/users/" + userId), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(mockResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(mockResponses)).thenReturn(null);

        // Act
        List<TaskDto> result = taskService.getUserTask(userId);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/users/" + userId), eq(TaskMicroserviceResponse[].class));
    }

    @Test
    void testGetUserTask_EmptyList() {
        // Arrange
        String userId = "user1";
        TaskMicroserviceResponse[] emptyResponses = new TaskMicroserviceResponse[]{};
        List<TaskDto> emptyDtos = List.of();

        when(restTemplate.getForEntity(eq("http://task:3031/task/users/" + userId), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(emptyResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(emptyResponses)).thenReturn(emptyDtos);

        // Act
        List<TaskDto> result = taskService.getUserTask(userId);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
    }

    // ===== createTask() Tests =====

    @Test
    void testCreateTask_Success() {
        // Arrange
        when(taskDTOWrapper.toTaskMicroserviceUpsert(mockTaskPostRequest)).thenReturn(mockUpsertRequest);
        when(restTemplate.exchange(
            eq("http://task:3031/task/"),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(TaskMicroserviceResponse.class)
        )).thenReturn(new ResponseEntity<>(mockTaskResponse, HttpStatus.OK));

        // Act
        assertDoesNotThrow(() -> taskService.createTask(mockTaskPostRequest));

        // Assert
        verify(taskDTOWrapper, times(1)).toTaskMicroserviceUpsert(mockTaskPostRequest);
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/task/"),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(TaskMicroserviceResponse.class)
        );
    }

    @Test
    void testCreateTask_FailureStatusCode() {
        // Arrange
        when(taskDTOWrapper.toTaskMicroserviceUpsert(mockTaskPostRequest)).thenReturn(mockUpsertRequest);
        when(restTemplate.exchange(
            eq("http://task:3031/task/"),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(TaskMicroserviceResponse.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.BAD_REQUEST));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> taskService.createTask(mockTaskPostRequest));
        assertTrue(exception.getMessage().contains("Failed to create task"));
        assertTrue(exception.getMessage().contains("400"));
        verify(taskDTOWrapper, times(1)).toTaskMicroserviceUpsert(mockTaskPostRequest);
    }

    // ===== updateTask() Tests =====

    @Test
    void testUpdateTask_Success() {
        // Arrange
        String taskId = "task123";
        when(taskDTOWrapper.toTaskMicroserviceUpsert(mockTaskPostRequest)).thenReturn(mockUpsertRequest);
        when(restTemplate.exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.PUT),
            any(HttpEntity.class),
            eq(TaskMicroserviceResponse.class)
        )).thenReturn(new ResponseEntity<>(mockTaskResponse, HttpStatus.OK));

        // Act
        assertDoesNotThrow(() -> taskService.updateTask(taskId, mockTaskPostRequest));

        // Assert
        verify(taskDTOWrapper, times(1)).toTaskMicroserviceUpsert(mockTaskPostRequest);
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.PUT),
            any(HttpEntity.class),
            eq(TaskMicroserviceResponse.class)
        );
    }

    @Test
    void testUpdateTask_FailureStatusCode() {
        // Arrange
        String taskId = "task123";
        when(taskDTOWrapper.toTaskMicroserviceUpsert(mockTaskPostRequest)).thenReturn(mockUpsertRequest);
        when(restTemplate.exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.PUT),
            any(HttpEntity.class),
            eq(TaskMicroserviceResponse.class)
        )).thenReturn(new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> taskService.updateTask(taskId, mockTaskPostRequest));
        assertTrue(exception.getMessage().contains("Failed to update task"));
        assertTrue(exception.getMessage().contains("500"));
        verify(taskDTOWrapper, times(1)).toTaskMicroserviceUpsert(mockTaskPostRequest);
    }

    // ===== getTaskByIdWithOwner() Tests =====

    @Test
    void testGetTaskByIdWithOwner_Success() {
        // Arrange
        String taskId = "task123";
        when(restTemplate.getForEntity(eq("http://task:3031/task/" + taskId), eq(TaskMicroserviceResponse.class)))
            .thenReturn(new ResponseEntity<>(mockTaskResponse, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDto(mockTaskResponse)).thenReturn(mockTaskDto);
        doNothing().when(taskDTOWrapper).addOwnerInformation(mockTaskDto);

        // Act
        TaskDto result = taskService.getTaskByIdWithOwner(taskId);

        // Assert
        assertNotNull(result);
        assertEquals("task123", result.getTaskId());
        assertEquals("Sample Task", result.getTaskTitle());
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/" + taskId), eq(TaskMicroserviceResponse.class));
        verify(taskDTOWrapper, times(1)).toTaskDto(mockTaskResponse);
        verify(taskDTOWrapper, times(1)).addOwnerInformation(mockTaskDto);
    }

    @Test
    void testGetTaskByIdWithOwner_NullResponse() {
        // Arrange
        String taskId = "task123";
        when(restTemplate.getForEntity(eq("http://task:3031/task/" + taskId), eq(TaskMicroserviceResponse.class)))
            .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> taskService.getTaskByIdWithOwner(taskId));
        assertTrue(exception.getMessage().contains("Task not found for ID"));
        assertTrue(exception.getMessage().contains(taskId));
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/" + taskId), eq(TaskMicroserviceResponse.class));
        verify(taskDTOWrapper, never()).toTaskDto(any());
        verify(taskDTOWrapper, never()).addOwnerInformation(any());
    }

    // ===== getSubTaskByTaskId() Tests =====

    @Test
    void testGetSubTaskByTaskId_Success() {
        // Arrange
        String taskId = "task123";
        TaskMicroserviceResponse[] mockResponses = new TaskMicroserviceResponse[]{mockTaskResponse};
        List<TaskDto> expectedDtos = List.of(mockTaskDto);

        when(restTemplate.getForEntity(eq("http://task:3031/task/" + taskId + "/subtasks"), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(mockResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(mockResponses)).thenReturn(expectedDtos);

        // Act
        List<TaskDto> result = taskService.getSubTaskByTaskId(taskId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("task123", result.get(0).getTaskId());
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/" + taskId + "/subtasks"), eq(TaskMicroserviceResponse[].class));
        verify(taskDTOWrapper, times(1)).toTaskDtoList(mockResponses);
    }

    @Test
    void testGetSubTaskByTaskId_NullResponse() {
        // Arrange
        String taskId = "task123";
        TaskMicroserviceResponse[] mockResponses = new TaskMicroserviceResponse[]{mockTaskResponse};

        when(restTemplate.getForEntity(eq("http://task:3031/task/" + taskId + "/subtasks"), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(mockResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(mockResponses)).thenReturn(null);

        // Act
        List<TaskDto> result = taskService.getSubTaskByTaskId(taskId);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
        verify(restTemplate, times(1)).getForEntity(eq("http://task:3031/task/" + taskId + "/subtasks"), eq(TaskMicroserviceResponse[].class));
    }

    @Test
    void testGetSubTaskByTaskId_EmptyList() {
        // Arrange
        String taskId = "task123";
        TaskMicroserviceResponse[] emptyResponses = new TaskMicroserviceResponse[]{};
        List<TaskDto> emptyDtos = List.of();

        when(restTemplate.getForEntity(eq("http://task:3031/task/" + taskId + "/subtasks"), eq(TaskMicroserviceResponse[].class)))
            .thenReturn(new ResponseEntity<>(emptyResponses, HttpStatus.OK));
        when(taskDTOWrapper.toTaskDtoList(emptyResponses)).thenReturn(emptyDtos);

        // Act
        List<TaskDto> result = taskService.getSubTaskByTaskId(taskId);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
    }

    // ===== deleteTask() Tests =====

    @Test
    void testDeleteTask_Success_With200StatusCode() {
        // Arrange
        String taskId = "task123";
        when(restTemplate.exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.OK));

        // Act
        assertDoesNotThrow(() -> taskService.deleteTask(taskId));

        // Assert
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        );
    }

    @Test
    void testDeleteTask_Success_With204StatusCode() {
        // Arrange
        String taskId = "task123";
        when(restTemplate.exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        // Act
        assertDoesNotThrow(() -> taskService.deleteTask(taskId));

        // Assert
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        );
    }

    @Test
    void testDeleteTask_FailureWithBadRequestStatusCode() {
        // Arrange
        String taskId = "task123";
        when(restTemplate.exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.BAD_REQUEST));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> taskService.deleteTask(taskId));
        assertTrue(exception.getMessage().contains("Failed to delete task"));
        assertTrue(exception.getMessage().contains("400"));
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        );
    }

    @Test
    void testDeleteTask_FailureWithNotFoundStatusCode() {
        // Arrange
        String taskId = "nonexistent123";
        when(restTemplate.exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.NOT_FOUND));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> taskService.deleteTask(taskId));
        assertTrue(exception.getMessage().contains("Failed to delete task"));
        assertTrue(exception.getMessage().contains("404"));
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        );
    }

    @Test
    void testDeleteTask_FailureWithInternalServerErrorStatusCode() {
        // Arrange
        String taskId = "task123";
        when(restTemplate.exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> taskService.deleteTask(taskId));
        assertTrue(exception.getMessage().contains("Failed to delete task"));
        assertTrue(exception.getMessage().contains("500"));
        verify(restTemplate, times(1)).exchange(
            eq("http://task:3031/task/" + taskId),
            eq(HttpMethod.DELETE),
            any(),
            eq(Void.class)
        );
    }
}
