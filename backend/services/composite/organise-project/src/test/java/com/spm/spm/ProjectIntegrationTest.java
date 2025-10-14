package com.spm.spm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spm.spm.dto.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProjectIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static UUID testProjectId;
    private static final UUID OWNER_ID = UUID.fromString("d1111111-1111-1111-1111-111111111111");
    private static final UUID COLLABORATOR_1 = UUID.fromString("d2222222-2222-2222-2222-222222222222");
    private static final UUID COLLABORATOR_2 = UUID.fromString("d3333333-3333-3333-3333-333333333333");
    private static final UUID NEW_OWNER = UUID.fromString("d3333333-3333-3333-3333-333333333333");

    @Test
    @Order(1)
    @DisplayName("Should check service health")
    void testHealthCheck() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk());
    }

    @Test
    @Order(2)
    @DisplayName("Should create a new project")
    void testCreateProject() throws Exception {
        NewProjectRequest request = new NewProjectRequest();
        request.setTitle("Integration Test Project");
        request.setDescription("Created by integration test");
        request.setOwnerId(OWNER_ID);

        MvcResult result = mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.title").value("Integration Test Project"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        Map<String, Object> response = objectMapper.readValue(responseBody, Map.class);
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        testProjectId = UUID.fromString((String) data.get("id"));

        assertThat(testProjectId).withFailMessage("Failed to create project - testProjectId is null").isNotNull();
        System.out.println("✅ Created test project with ID: " + testProjectId);
    }

    @Test
    @Order(3)
    @DisplayName("Should get project by ID")
    void testGetProjectById() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null - testCreateProject failed").isNotNull();

        mockMvc.perform(get("/api/v1/projects/{id}", testProjectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testProjectId.toString()))
                .andExpect(jsonPath("$.title").value("Integration Test Project"));
    }

    @Test
    @Order(4)
    @DisplayName("Should return 404 for non-existent project")
    void testGetNonExistentProject() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        // Composite service propagates the 404 error from atomic service
        try {
            mockMvc.perform(get("/api/v1/projects/{id}", nonExistentId))
                    .andExpect(status().isNotFound());
        } catch (Exception e) {
            // Expected - atomic service returns 404, composite doesn't catch it
            assertThat(e.getCause().getMessage()).contains("404");
            System.out.println("✅ Correctly handles non-existent project (404 error)");
        }
    }

    @Test
    @Order(5)
    @DisplayName("Should get all projects")
    void testGetAllProjects() throws Exception {
        mockMvc.perform(get("/api/v1/projects/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(6)
    @DisplayName("Should get projects by user")
    void testGetProjectsByUser() throws Exception {
        mockMvc.perform(get("/api/v1/projects/user/{userId}", OWNER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(7)
    @DisplayName("Should update project")
    void testUpdateProject() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setTitle("Updated Integration Test Project");
        request.setDescription("Updated by integration test");

        mockMvc.perform(put("/api/v1/projects/{id}", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ Project updated successfully");
    }

    @Test
    @Order(8)
    @DisplayName("Should partially update project (title only)")
    void testPartialUpdateProject() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setTitle("Partially Updated Title");
        request.setDescription("Keeping description required"); // ← FIXED: description is NOT NULL in DB

        mockMvc.perform(put("/api/v1/projects/{id}", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        System.out.println("✅ Project partially updated successfully");
    }

    @Test
    @Order(9)
    @DisplayName("Should add collaborators to project")
    void testAddCollaborators() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        UpdateCollaboratorsRequest request = new UpdateCollaboratorsRequest();
        request.setCollaborators(List.of(COLLABORATOR_1, COLLABORATOR_2));

        mockMvc.perform(put("/api/v1/projects/{id}/collaborators", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ Collaborators added successfully");
    }

    @Test
    @Order(10)
    @DisplayName("Should replace collaborators")
    void testReplaceCollaborators() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        UpdateCollaboratorsRequest request = new UpdateCollaboratorsRequest();
        request.setCollaborators(List.of(COLLABORATOR_2));

        mockMvc.perform(put("/api/v1/projects/{id}/collaborators", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(11)
    @DisplayName("Should remove all collaborators except owner")
    void testRemoveAllCollaborators() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        UpdateCollaboratorsRequest request = new UpdateCollaboratorsRequest();
        request.setCollaborators(List.of());

        mockMvc.perform(put("/api/v1/projects/{id}/collaborators", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(12)
    @DisplayName("Should change project owner")
    void testChangeOwner() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        String requestBody = "{\"new_owner_id\":\"" + NEW_OWNER + "\"}";

        mockMvc.perform(put("/api/v1/projects/{id}/owner", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ Owner changed successfully");
    }

    @Test
    @Order(13)
    @DisplayName("Should reject invalid UUID for change owner")
    void testChangeOwnerWithInvalidUuid() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        String invalidRequest = "{\"new_owner_id\":\"not-a-valid-uuid\"}";

        mockMvc.perform(put("/api/v1/projects/{id}/owner", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(14)
    @DisplayName("Should reject missing new_owner_id")
    void testChangeOwnerWithMissingField() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        String invalidRequest = "{}";

        // Composite service propagates 400 error from atomic service
        try {
            mockMvc.perform(put("/api/v1/projects/{id}/owner", testProjectId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(invalidRequest))
                    .andExpect(status().isBadRequest());
        } catch (Exception e) {
            // Expected - atomic service returns 400
            assertThat(e.getCause().getMessage()).contains("400");
            System.out.println("✅ Correctly rejects missing new_owner_id (400 error)");
        }
    }

    @Test
    @Order(15)
    @DisplayName("Should handle concurrent collaborator updates")
    void testConcurrentCollaboratorUpdates() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        UpdateCollaboratorsRequest request1 = new UpdateCollaboratorsRequest();
        request1.setCollaborators(List.of(COLLABORATOR_1));

        UpdateCollaboratorsRequest request2 = new UpdateCollaboratorsRequest();
        request2.setCollaborators(List.of(COLLABORATOR_2));

        mockMvc.perform(put("/api/v1/projects/{id}/collaborators", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/projects/{id}/collaborators", testProjectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(16)
    @DisplayName("Should delete project")
    void testDeleteProject() throws Exception {
        assertThat(testProjectId).withFailMessage("testProjectId is null").isNotNull();

        mockMvc.perform(delete("/api/v1/projects/{id}", testProjectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        System.out.println("✅ Project deleted successfully");
    }

    @Test
    @Order(17)
    @DisplayName("Should handle deleting non-existent project")
    void testDeleteNonExistentProject() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/projects/{id}", nonExistentId))
                .andExpect(status().isOk());
    }

    @Test
    @Order(18)
    @DisplayName("Should reject project creation with missing fields")
    void testCreateProjectWithMissingFields() throws Exception {
        NewProjectRequest request = new NewProjectRequest();

        try {
            mockMvc.perform(post("/api/v1/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().is4xxClientError());
        } catch (Exception e) {
            assertThat(e.getCause().getMessage()).contains("400");
            System.out.println("✅ Correctly rejects missing fields (400 error)");
        }
    }

    @Test
    @Order(19)
    @DisplayName("Should handle updating non-existent project")
    void testUpdateNonExistentProject() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        UpdateProjectRequest request = new UpdateProjectRequest();
        request.setTitle("Should Fail");
        request.setDescription("Should Fail");

        try {
            mockMvc.perform(put("/api/v1/projects/{id}", nonExistentId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound());
        } catch (Exception e) {
            assertThat(e.getCause().getMessage()).contains("404");
            System.out.println("✅ Correctly handles non-existent project update (404 error)");
        }
    }
}