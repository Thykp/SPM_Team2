package com.spm.manage_task.components;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.spm.manage_task.dto.TaskDto;
import com.spm.manage_task.dto.TaskPostRequestDto;
import com.spm.manage_task.dto.UserDto;
import com.spm.manage_task.factory.Participant;
import com.spm.manage_task.factory.TaskMicroserviceResponse;
import com.spm.manage_task.factory.TaskMicroserviceUpsertRequest;
import com.spm.manage_task.services.ProfileService;

@ExtendWith(MockitoExtension.class)
class TaskDTOWrapperComponentTest {

    @Mock
    private ProfileService profileService;

    @InjectMocks
    private TaskDTOWrapperComponent taskDTOWrapper;

    private TaskMicroserviceResponse sampleRawTask;
    private List<Participant> sampleParticipants;
    private UserDto sampleOwner;

    @BeforeEach
    void setUp() {
        // Setup sample participants
        sampleParticipants = new ArrayList<>();
        sampleParticipants.add(new Participant(true, "owner-123"));
        sampleParticipants.add(new Participant(false, "collab-456"));
        sampleParticipants.add(new Participant(false, "collab-789"));

        // Setup sample raw task
        sampleRawTask = new TaskMicroserviceResponse();
        sampleRawTask.setTaskId("task-123");
        sampleRawTask.setTaskTitle("Test Task");
        sampleRawTask.setProjectId("project-456");
        sampleRawTask.setTaskDeadline("2025-12-31");
        sampleRawTask.setTaskDescription("Test description");
        sampleRawTask.setTaskStatus("Ongoing");
        sampleRawTask.setTaskParticipants(sampleParticipants);
        sampleRawTask.setParentTaskId(null);

        // Setup sample owner
        sampleOwner = new UserDto("owner-123", "dept-1", "team-1", "John Doe", "Developer", "Engineering", "Backend Team");
    }

    // ========================================
    // toTaskDto() Tests
    // ========================================

    @Test
    void toTaskDto_ShouldConvertSuccessfully() {
        // Arrange
        when(profileService.getUserById("owner-123")).thenReturn(sampleOwner);

        // Act
        TaskDto result = taskDTOWrapper.toTaskDto(sampleRawTask);

        // Assert
        assertNotNull(result);
        assertEquals("task-123", result.getTaskId());
        assertEquals("Test Task", result.getTaskTitle());
        assertEquals("project-456", result.getTaskProjectId());
        assertEquals("2025-12-31", result.getTaskDeadline());
        assertEquals("Test description", result.getTaskDescription());
        assertEquals("Ongoing", result.getTaskStatus());
        assertEquals("owner-123", result.getTaskOwner());
        assertEquals(2, result.getTaskCollaborators().size());
        assertTrue(result.getTaskCollaborators().contains("collab-456"));
        assertTrue(result.getTaskCollaborators().contains("collab-789"));
        assertEquals("John Doe", result.getTaskOwnerName());
        assertEquals("Engineering", result.getTaskOwnerDepartment());

        verify(profileService, times(1)).getUserById("owner-123");
    }

    @Test
    void toTaskDto_WithNullInput_ShouldReturnNull() {
        // Act
        TaskDto result = taskDTOWrapper.toTaskDto(null);

        // Assert
        assertNull(result);
        verify(profileService, never()).getUserById(anyString());
    }

    @Test
    void toTaskDto_WithNoParticipants_ShouldHandleGracefully() {
        // Arrange
        sampleRawTask.setTaskParticipants(null);

        // Act
        TaskDto result = taskDTOWrapper.toTaskDto(sampleRawTask);

        // Assert
        assertNotNull(result);
        assertNull(result.getTaskOwner());
        assertTrue(result.getTaskCollaborators().isEmpty());
    }

    @Test
    void toTaskDto_WithOnlyOwner_ShouldHaveNoCollaborators() {
        // Arrange
        List<Participant> ownerOnly = List.of(new Participant(true, "owner-123"));
        sampleRawTask.setTaskParticipants(ownerOnly);
        when(profileService.getUserById("owner-123")).thenReturn(sampleOwner);

        // Act
        TaskDto result = taskDTOWrapper.toTaskDto(sampleRawTask);

        // Assert
        assertNotNull(result);
        assertEquals("owner-123", result.getTaskOwner());
        assertTrue(result.getTaskCollaborators().isEmpty());
    }

    @Test
    void toTaskDto_WithNoOwner_ShouldHandleGracefully() {
        // Arrange
        List<Participant> collaboratorsOnly = List.of(
            new Participant(false, "collab-456"),
            new Participant(false, "collab-789")
        );
        sampleRawTask.setTaskParticipants(collaboratorsOnly);

        // Act
        TaskDto result = taskDTOWrapper.toTaskDto(sampleRawTask);

        // Assert
        assertNotNull(result);
        assertNull(result.getTaskOwner());
        assertEquals(2, result.getTaskCollaborators().size());
    }

    // ========================================
    // toTaskDtoList() Tests
    // ========================================

    @Test
    void toTaskDtoList_ShouldConvertMultipleTasks() {
        // Arrange
        TaskMicroserviceResponse task2 = new TaskMicroserviceResponse();
        task2.setTaskId("task-456");
        task2.setTaskTitle("Second Task");
        task2.setProjectId("project-456");
        task2.setTaskDeadline("2025-11-30");
        task2.setTaskDescription("Second description");
        task2.setTaskStatus("Under Review");
        task2.setTaskParticipants(sampleParticipants);

        TaskMicroserviceResponse[] rawTasks = {sampleRawTask, task2};

        when(profileService.getUserById("owner-123")).thenReturn(sampleOwner);

        // Act
        List<TaskDto> result = taskDTOWrapper.toTaskDtoList(rawTasks);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("task-123", result.get(0).getTaskId());
        assertEquals("task-456", result.get(1).getTaskId());
        verify(profileService, times(2)).getUserById("owner-123");
    }

    @Test
    void toTaskDtoList_WithNullInput_ShouldReturnEmptyList() {
        // Act
        List<TaskDto> result = taskDTOWrapper.toTaskDtoList(null);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void toTaskDtoList_WithEmptyArray_ShouldReturnEmptyList() {
        // Act
        List<TaskDto> result = taskDTOWrapper.toTaskDtoList(new TaskMicroserviceResponse[0]);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    // ========================================
    // addOwnerInformation() Tests
    // ========================================

    @Test
    void addOwnerInformation_ShouldAddOwnerDetails() {
        // Arrange
        TaskDto task = new TaskDto("task-123", "Test Task", "project-456", "2025-12-31", 
                                    "Test description", "Ongoing", new ArrayList<>(), 
                                    "owner-123", null, null, null);
        when(profileService.getUserById("owner-123")).thenReturn(sampleOwner);

        // Act
        taskDTOWrapper.addOwnerInformation(task);

        // Assert
        assertEquals("John Doe", task.getTaskOwnerName());
        assertEquals("Engineering", task.getTaskOwnerDepartment());
        verify(profileService, times(1)).getUserById("owner-123");
    }

    @Test
    void addOwnerInformation_WithNullTask_ShouldHandleGracefully() {
        // Act & Assert
        assertDoesNotThrow(() -> taskDTOWrapper.addOwnerInformation(null));
        verify(profileService, never()).getUserById(anyString());
    }

    @Test
    void addOwnerInformation_WhenProfileServiceReturnsNull_ShouldSetUnknown() {
        // Arrange
        TaskDto task = new TaskDto("task-123", "Test Task", "project-456", "2025-12-31", 
                                    "Test description", "Ongoing", new ArrayList<>(), 
                                    "owner-123", null, null, null);
        when(profileService.getUserById("owner-123")).thenReturn(null);

        // Act
        taskDTOWrapper.addOwnerInformation(task);

        // Assert
        assertEquals("Unknown", task.getTaskOwnerName());
        assertEquals("Unknown", task.getTaskOwnerDepartment());
        verify(profileService, times(1)).getUserById("owner-123");
    }

    // ========================================
    // toTaskMicroserviceUpsert() Tests
    // ========================================

    @Test
    void toTaskMicroserviceUpsert_ShouldConvertSuccessfully() {
        // Arrange
        ArrayList<String> collaborators = new ArrayList<>(List.of("collab-456", "collab-789"));
        TaskPostRequestDto postRequest = new TaskPostRequestDto(
            "New Task", 
            "2026-01-15", 
            "project-456",
            "New task description",
            "Ongoing",
            collaborators,
            "owner-123",
            null
        );

        // Act
        TaskMicroserviceUpsertRequest result = taskDTOWrapper.toTaskMicroserviceUpsert(postRequest);

        // Assert
        assertNotNull(result);
        assertEquals("project-456", result.getProjectId());
        assertEquals("New Task", result.getTitle());
        assertEquals("2026-01-15", result.getDeadline());
        assertEquals("New task description", result.getDescription());
        assertEquals("Ongoing", result.getStatus());
        assertNotNull(result.getParticipants());
        assertEquals(3, result.getParticipants().size());
        
        // Verify participants
        long ownerCount = result.getParticipants().stream().filter(Participant::getIsOwner).count();
        long collabCount = result.getParticipants().stream().filter(p -> !p.getIsOwner()).count();
        assertEquals(1, ownerCount);
        assertEquals(2, collabCount);
    }

    @Test
    void toTaskMicroserviceUpsert_WithNoCollaborators_ShouldHaveOwnerOnly() {
        // Arrange
        TaskPostRequestDto postRequest = new TaskPostRequestDto(
            "Solo Task",
            "2026-02-20",
            "project-456",
            "Task with owner only",
            "Under Review",
            new ArrayList<>(),
            "owner-123",
            null
        );

        // Act
        TaskMicroserviceUpsertRequest result = taskDTOWrapper.toTaskMicroserviceUpsert(postRequest);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getParticipants().size());
        assertTrue(result.getParticipants().get(0).getIsOwner());
        assertEquals("owner-123", result.getParticipants().get(0).getProfileId());
    }

    @Test
    void toTaskMicroserviceUpsert_WithParentTask_ShouldSetParentId() {
        // Arrange
        TaskPostRequestDto postRequest = new TaskPostRequestDto(
            "Subtask",
            "2026-03-01",
            "project-456",
            "This is a subtask",
            "Ongoing",
            new ArrayList<>(),
            "owner-123",
            "parent-task-123"
        );

        // Act
        TaskMicroserviceUpsertRequest result = taskDTOWrapper.toTaskMicroserviceUpsert(postRequest);

        // Assert
        assertNotNull(result);
        assertEquals("parent-task-123", result.getParentTaskId());
    }
}
