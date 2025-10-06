package com.spm.spm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spm.spm.dto.*;
import com.spm.spm.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @Autowired
    private ObjectMapper objectMapper;

    // ==================== GET /api/v1/projects (health) ====================
    
    @Test
    void health_ShouldReturnHealthStatus() throws Exception {
        when(projectService.health()).thenReturn("{status: ok}");

        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk())
                .andExpect(content().string("{status: ok}"));
    }

    // ==================== GET /api/v1/projects/{id} ====================
    
    @Test
    void getProjectById_ShouldReturnProject_WhenProjectExists() throws Exception {
        UUID projectId = UUID.randomUUID();
        ProjectDto mockProject = new ProjectDto();
        mockProject.setId(projectId);
        mockProject.setTitle("Test Project");
        mockProject.setDescription("Test Description");

        when(projectService.getProjectById(projectId)).thenReturn(mockProject);

        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.title").value("Test Project"))
                .andExpect(jsonPath("$.description").value("Test Description"));
    }

    @Test
    void getProjectById_ShouldReturn404_WhenProjectNotFound() throws Exception {
        UUID projectId = UUID.randomUUID();

        when(projectService.getProjectById(projectId)).thenReturn(null);

        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isNotFound());
    }

    // ==================== GET /api/v1/projects/all ====================
    
    @Test
    void getAllProjects_ShouldReturnProjectList() throws Exception {
        ProjectDto project1 = new ProjectDto();
        project1.setId(UUID.randomUUID());
        project1.setTitle("Project 1");

        ProjectDto project2 = new ProjectDto();
        project2.setId(UUID.randomUUID());
        project2.setTitle("Project 2");

        List<ProjectDto> mockProjects = Arrays.asList(project1, project2);

        when(projectService.getAll()).thenReturn(mockProjects);  // ← FIXED: getAll() not getAllProjects()

        mockMvc.perform(get("/api/v1/projects/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Project 1"))
                .andExpect(jsonPath("$[1].title").value("Project 2"));
    }

    // ==================== GET /api/v1/projects/user/{userId} ====================
    
    @Test
    void getProjectsByUser_ShouldReturnUserProjects() throws Exception {
        UUID userId = UUID.randomUUID();
        
        ProjectDto project1 = new ProjectDto();
        project1.setId(UUID.randomUUID());
        project1.setTitle("User Project 1");
        project1.setOwner(userId);

        List<ProjectDto> mockProjects = List.of(project1);

        when(projectService.getProjectsByUser(userId)).thenReturn(mockProjects);

        mockMvc.perform(get("/api/v1/projects/user/{userId}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("User Project 1"));
    }

    // ==================== POST /api/v1/projects ====================
    
    @Test
    void createProject_ShouldReturnCreatedProject() throws Exception {
        UUID ownerId = UUID.randomUUID();
        NewProjectRequest newProject = new NewProjectRequest();
        newProject.setTitle("New Project");
        newProject.setDescription("New Description");
        newProject.setOwnerId(ownerId);

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("data", Map.of(
                "id", UUID.randomUUID().toString(),
                "title", "New Project",
                "description", "New Description",
                "owner_id", ownerId.toString()
        ));

        when(projectService.create(any(NewProjectRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newProject)))
                .andExpect(status().isCreated())  // ← FIXED: POST should return 201 Created
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("New Project"));
    }

    // ==================== PUT /api/v1/projects/{id} ====================
    
    @Test
    void updateProject_ShouldReturnUpdatedProject() throws Exception {
        UUID projectId = UUID.randomUUID();
        UpdateProjectRequest updateRequest = new UpdateProjectRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setDescription("Updated Description");

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("message", "Project updated successfully");

        when(projectService.updateProject(eq(projectId), any(UpdateProjectRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Project updated successfully"));
    }

    @Test
    void updateProject_PartialUpdate_ShouldWork() throws Exception {
        UUID projectId = UUID.randomUUID();
        UpdateProjectRequest updateRequest = new UpdateProjectRequest();
        updateRequest.setTitle("Only Title Updated");

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("message", "Project updated successfully");

        when(projectService.updateProject(eq(projectId), any(UpdateProjectRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ==================== PUT /api/v1/projects/{id}/collaborators ====================
    
    @Test
    void updateCollaborators_ShouldReturnSuccess() throws Exception {
        UUID projectId = UUID.randomUUID();
        UpdateCollaboratorsRequest request = new UpdateCollaboratorsRequest();
        request.setCollaborators(Arrays.asList(
                UUID.randomUUID(),
                UUID.randomUUID()
        ));

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("message", "Collaborators updated successfully");

        when(projectService.updateCollaborators(eq(projectId), any(UpdateCollaboratorsRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/projects/{id}/collaborators", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Collaborators updated successfully"));
    }

    // ==================== PUT /api/v1/projects/{id}/owner ====================
    
    @Test
    void changeOwner_ShouldReturnSuccess() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID newOwnerId = UUID.randomUUID();
        UUID previousOwnerId = UUID.randomUUID();
        
        ChangeOwnerRequest request = new ChangeOwnerRequest(newOwnerId);

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("message", "Project owner changed successfully");
        mockResponse.put("data", Map.of(
                "previous_owner", previousOwnerId.toString(),
                "new_owner", newOwnerId.toString()
        ));

        when(projectService.changeOwner(eq(projectId), any(ChangeOwnerRequest.class)))
                .thenReturn(mockResponse);

        // Note: JSON uses snake_case for the request body
        String requestBody = "{\"new_owner_id\":\"" + newOwnerId.toString() + "\"}";

        mockMvc.perform(put("/api/v1/projects/{id}/owner", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Project owner changed successfully"))
                .andExpect(jsonPath("$.data.new_owner").value(newOwnerId.toString()))
                .andExpect(jsonPath("$.data.previous_owner").value(previousOwnerId.toString()));
    }

    @Test
    void changeOwner_WithInvalidUuid_ShouldReturn400() throws Exception {
        UUID projectId = UUID.randomUUID();
        String invalidRequest = "{\"new_owner_id\":\"not-a-uuid\"}";

        mockMvc.perform(put("/api/v1/projects/{id}/owner", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());
    }

    // ==================== DELETE /api/v1/projects/{id} ====================
    
    @Test
    void deleteProject_ShouldReturnSuccess() throws Exception {
        UUID projectId = UUID.randomUUID();

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("message", "Project deleted successfully");

        when(projectService.deleteProject(projectId)).thenReturn(mockResponse);

        mockMvc.perform(delete("/api/v1/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Project deleted successfully"));
    }
}