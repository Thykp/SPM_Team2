package com.spm.spm.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.spm.spm.dto.ChangeOwnerRequest;
import com.spm.spm.dto.CollaboratorDto;
import com.spm.spm.dto.NewProjectRequest;
import com.spm.spm.dto.ProjectDto;
import com.spm.spm.dto.UpdateCollaboratorsRequest;
import com.spm.spm.dto.UpdateProjectRequest;

class ProjectServiceTest {

    private RestTemplate restTemplate;
    private ProjectService projectService;
    private final String baseUrl = "http://project:3040";

    @BeforeEach
    void setUp() {
        restTemplate = mock(RestTemplate.class);
        projectService = new ProjectService(restTemplate, baseUrl);
    }

    @Test
    void testHealth() {
        Map<String, Object> mockResponse = Map.of("status", "ok", "message", "Project service is running");
        when(restTemplate.getForEntity(eq(baseUrl + "/project/"), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(mockResponse));

        String result = projectService.health();

        assertThat(result).contains("status");
        verify(restTemplate).getForEntity(eq(baseUrl + "/project/"), eq(Map.class));
    }

    @Test
    void testGetAll() {
        UUID projectId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        ProjectDto project = new ProjectDto();
        project.setId(projectId);
        project.setTitle("Test Project");
        project.setDescription("Test Description");
        project.setCreatedAt(now);
        project.setUpdatedAt(now);
        project.setOwner(ownerId);
        project.setCollaborators(List.of());

        ProjectDto[] mockResponse = new ProjectDto[]{project};
        when(restTemplate.getForEntity(eq(baseUrl + "/project/all"), eq(ProjectDto[].class)))
                .thenReturn(ResponseEntity.ok(mockResponse));

        List<ProjectDto> result = projectService.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(projectId);
        assertThat(result.get(0).getTitle()).isEqualTo("Test Project");
        verify(restTemplate).getForEntity(eq(baseUrl + "/project/all"), eq(ProjectDto[].class));
    }

    @Test
    void testGetProjectsByUser() {
        UUID userId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        ProjectDto project = new ProjectDto();
        project.setId(projectId);
        project.setTitle("User Project");
        project.setDescription("Test Description");
        project.setCreatedAt(now);
        project.setUpdatedAt(now);
        project.setOwner(userId);
        project.setCollaborators(List.of());

        ProjectDto[] mockResponse = new ProjectDto[]{project};
        when(restTemplate.getForEntity(eq(baseUrl + "/project/user/" + userId.toString()), eq(ProjectDto[].class)))
                .thenReturn(ResponseEntity.ok(mockResponse));

        List<ProjectDto> result = projectService.getProjectsByUser(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOwner()).isEqualTo(userId);
        verify(restTemplate).getForEntity(eq(baseUrl + "/project/user/" + userId.toString()), eq(ProjectDto[].class));
    }

    @Test
    void testCreate() {
        UUID ownerId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        NewProjectRequest request = new NewProjectRequest("Test Project", "Test Description", ownerId);

        Map<String, Object> mockResponse = Map.of(
                "success", true,
                "message", "Project created successfully",
                "data", Map.of(
                        "id", projectId.toString(),
                        "title", "Test Project",
                        "description", "Test Description"
                ),
                "timestamp", OffsetDateTime.now().toString()
        );

        when(restTemplate.postForEntity(
                eq(baseUrl + "/project/"),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(ResponseEntity.status(HttpStatus.CREATED).body(mockResponse));

        Map<String, Object> result = projectService.create(request);

        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("message")).isEqualTo("Project created successfully");

        ArgumentCaptor<HttpEntity> captor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq(baseUrl + "/project/"), captor.capture(), eq(Map.class));

        HttpEntity<NewProjectRequest> capturedEntity = captor.getValue();
        NewProjectRequest capturedBody = capturedEntity.getBody();
        assertThat(capturedBody.getTitle()).isEqualTo("Test Project");
        assertThat(capturedBody.getDescription()).isEqualTo("Test Description");
        assertThat(capturedBody.getOwnerId()).isEqualTo(ownerId);
    }

    @Test
    void testGetProjectById() {
        UUID projectId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID collaboratorId1 = UUID.randomUUID();
        UUID collaboratorId2 = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        // Create a mock ProjectDto response
        ProjectDto mockResponse = new ProjectDto();
        mockResponse.setId(projectId);
        mockResponse.setTitle("Test Project");
        mockResponse.setDescription("Test Description");
        mockResponse.setCreatedAt(now);
        mockResponse.setUpdatedAt(now);
        mockResponse.setOwner(ownerId);
        mockResponse.setCollaborators(List.of(collaboratorId1, collaboratorId2)); // Use UUIDs directly

        // Mock the RestTemplate call
        when(restTemplate.getForEntity(eq(baseUrl + "/project/" + projectId.toString()), eq(ProjectDto.class)))
                .thenReturn(ResponseEntity.ok(mockResponse));

        // Call the service method
        ProjectDto result = projectService.getProjectById(projectId);

        // Assertions
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(projectId);
        assertThat(result.getOwner()).isEqualTo(ownerId);
        assertThat(result.getCollaborators()).hasSize(2);
        assertThat(result.getCollaborators()).containsExactlyInAnyOrder(collaboratorId1, collaboratorId2); // Check UUIDs directly

        // Verify the RestTemplate call
        verify(restTemplate).getForEntity(eq(baseUrl + "/project/" + projectId.toString()), eq(ProjectDto.class));
}

    @Test
    void testUpdateProject() {
        UUID projectId = UUID.randomUUID();
        UpdateProjectRequest request = new UpdateProjectRequest("Updated Title", "Updated Description");

        Map<String, Object> mockResponse = Map.of(
                "success", true,
                "message", "Project updated successfully",
                "data", Map.of(
                        "id", projectId.toString(),
                        "title", "Updated Title",
                        "description", "Updated Description"
                ),
                "timestamp", OffsetDateTime.now().toString()
        );

        when(restTemplate.exchange(
                eq(baseUrl + "/project/" + projectId.toString()),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(ResponseEntity.ok(mockResponse));

        Map<String, Object> result = projectService.updateProject(projectId, request);

        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("message")).isEqualTo("Project updated successfully");
        verify(restTemplate).exchange(
                eq(baseUrl + "/project/" + projectId.toString()),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(Map.class)
        );
    }

    @Test
    void testUpdateCollaborators() {
        UUID projectId = UUID.randomUUID();
        UUID collaborator1 = UUID.randomUUID();
        UUID collaborator2 = UUID.randomUUID();
        UpdateCollaboratorsRequest request = new UpdateCollaboratorsRequest(List.of(collaborator1, collaborator2));

        Map<String, Object> mockResponse = Map.of(
                "success", true,
                "message", "Collaborators updated successfully",
                "timestamp", OffsetDateTime.now().toString()
        );

        when(restTemplate.exchange(
                eq(baseUrl + "/project/" + projectId.toString() + "/collaborators"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(ResponseEntity.ok(mockResponse));

        Map<String, Object> result = projectService.updateCollaborators(projectId, request);

        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("message")).isEqualTo("Collaborators updated successfully");
        verify(restTemplate).exchange(
                eq(baseUrl + "/project/" + projectId.toString() + "/collaborators"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(Map.class)
        );
    }

    @Test
    void testChangeOwner() {
        UUID projectId = UUID.randomUUID();
        UUID currentOwnerId = UUID.randomUUID();
        UUID newOwnerId = UUID.randomUUID();
        
        ChangeOwnerRequest request = new ChangeOwnerRequest(newOwnerId);

        Map<String, Object> mockResponse = Map.of(
                "success", true,
                "message", "Project owner changed successfully",
                "data", Map.of(
                        "previous_owner", currentOwnerId.toString(),
                        "new_owner", newOwnerId.toString()
                ),
                "timestamp", OffsetDateTime.now().toString()
        );

        when(restTemplate.exchange(
                eq(baseUrl + "/project/" + projectId.toString() + "/owner"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(ResponseEntity.ok(mockResponse));

        Map<String, Object> result = projectService.changeOwner(projectId, request);

        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("message")).isEqualTo("Project owner changed successfully");
        
        @SuppressWarnings("unchecked")
        Map<String, String> data = (Map<String, String>) result.get("data");
        assertThat(data.get("new_owner")).isEqualTo(newOwnerId.toString());
        
        verify(restTemplate).exchange(
                eq(baseUrl + "/project/" + projectId.toString() + "/owner"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(Map.class)
        );
        }

    @Test
    void testDeleteProject() {
        UUID projectId = UUID.randomUUID();

        Map<String, Object> mockResponse = Map.of(
                "success", true,
                "message", "Project deleted successfully",
                "timestamp", OffsetDateTime.now().toString()
        );

        when(restTemplate.exchange(
                eq(baseUrl + "/project/" + projectId.toString()),
                eq(HttpMethod.DELETE),
                isNull(),
                eq(Map.class)
        )).thenReturn(ResponseEntity.ok(mockResponse));

        Map<String, Object> result = projectService.deleteProject(projectId);

        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("message")).isEqualTo("Project deleted successfully");
        verify(restTemplate).exchange(
                eq(baseUrl + "/project/" + projectId.toString()),
                eq(HttpMethod.DELETE),
                isNull(),
                eq(Map.class)
        );
    }
}