package com.spm.spm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spm.spm.dto.ProjectDto;
import com.spm.spm.dto.UpdateProjectRequest;
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

    @Test
    void getProjectById_ShouldReturnProject_WhenProjectExists() throws Exception {
        UUID projectId = UUID.randomUUID();
        ProjectDto mockProject = new ProjectDto();
        mockProject.setId(projectId);
        mockProject.setTitle("Test Project");
        mockProject.setDescription("Test Description");

        when(projectService.getProjectById(projectId)).thenReturn(mockProject);

        mockMvc.perform(get("/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.title").value("Test Project"))
                .andExpect(jsonPath("$.description").value("Test Description"));
    }

    @Test
    void getProjectById_ShouldReturn404_WhenProjectNotFound() throws Exception {
        UUID projectId = UUID.randomUUID();

        when(projectService.getProjectById(projectId)).thenReturn(null);

        mockMvc.perform(get("/projects/{id}", projectId))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateProject_ShouldReturnUpdatedProject() throws Exception {
        UUID projectId = UUID.randomUUID();
        UpdateProjectRequest updateRequest = new UpdateProjectRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setDescription("Updated Description");

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("project", Map.of(
                "id", projectId.toString(),
                "title", "Updated Title",
                "description", "Updated Description"
        ));

        when(projectService.updateProject(eq(projectId), any(UpdateProjectRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.project.id").value(projectId.toString()))
                .andExpect(jsonPath("$.project.title").value("Updated Title"))
                .andExpect(jsonPath("$.project.description").value("Updated Description"));
    }

    @Test
    void updateProject_PartialUpdate_ShouldWork() throws Exception {
        UUID projectId = UUID.randomUUID();
        UpdateProjectRequest updateRequest = new UpdateProjectRequest();
        updateRequest.setTitle("Only Title Updated");

        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("success", true);
        mockResponse.put("project", Map.of(
                "id", projectId.toString(),
                "title", "Only Title Updated"
        ));

        when(projectService.updateProject(eq(projectId), any(UpdateProjectRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.project.title").value("Only Title Updated"));
    }
}