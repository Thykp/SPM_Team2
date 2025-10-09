package com.spm.spm.service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.spm.spm.dto.ChangeOwnerRequest;
import com.spm.spm.dto.CollaboratorDto;
import com.spm.spm.dto.NewProjectRequest;
import com.spm.spm.dto.ProjectDto;
import com.spm.spm.dto.UpdateCollaboratorsRequest;
import com.spm.spm.dto.UpdateProjectRequest;

import jakarta.annotation.PostConstruct;

@Service
public class ProjectService {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ProjectService(RestTemplate restTemplate,
                          @Value("${project.base.url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    @PostConstruct
    public void logBase() {
        System.out.println("[ProjectService] baseUrl = " + baseUrl);
    }

    /* Health check for the project atomic service */
    public String health() {
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp = restTemplate.getForEntity(baseUrl + "/project/", Map.class);
        Map<?, ?> body = resp.getBody();
        return body != null ? body.toString() : "{}";
    }

    /* Get all projects */
    public List<ProjectDto> getAll() {
        ResponseEntity<ProjectDto[]> resp =
                restTemplate.getForEntity(baseUrl + "/project/all", ProjectDto[].class);
        ProjectDto[] body = resp.getBody();
        return body == null ? List.of() : Arrays.asList(body);
    }

    /* Get all projects for a user (owner or collaborator) */
    public List<ProjectDto> getProjectsByUser(UUID userId) {
        System.out.println("[ProjectService] Fetching projects for user: " + userId);

        // Fetch the projects for the user
        ResponseEntity<ProjectDto[]> resp = restTemplate.getForEntity(
                baseUrl + "/project/user/" + userId.toString(), ProjectDto[].class);
        ProjectDto[] projects = resp.getBody();

        if (projects == null || projects.length == 0) {
            System.out.println("[ProjectService] No projects found for user: " + userId);
            return List.of(); // Return an empty list if no projects are found
        }

        // Enrich each project with owner and collaborators
        return Arrays.stream(projects).map(project -> {
            try {
                // Fetch owner ID
                System.out.println("[ProjectService] Fetching owner for project: " + project.getId());
                ResponseEntity<Map> ownerResp = restTemplate.getForEntity(
                        baseUrl + "/project/" + project.getId().toString() + "/owner", Map.class);
                Map<String, String> ownerData = ownerResp.getBody();
                UUID ownerId = ownerData != null && ownerData.containsKey("profile_id")
                        ? UUID.fromString(ownerData.get("profile_id"))
                        : null;
                project.setOwner(ownerId);

                // Fetch collaborator IDs
                System.out.println("[ProjectService] Fetching collaborators for project: " + project.getId());
                ResponseEntity<Map[]> collabResp = restTemplate.getForEntity(
                        baseUrl + "/project/" + project.getId().toString() + "/collaborators", Map[].class);
                Map[] collaborators = collabResp.getBody();

                List<UUID> collaboratorIds = collaborators != null
                        ? Arrays.stream(collaborators)
                                .map(collab -> UUID.fromString(collab.get("profile_id").toString()))
                                .toList()
                        : List.of();
                project.setCollaborators(collaboratorIds);

                return project;
            } catch (Exception e) {
                System.err.println("[ProjectService] Error processing project: " + project.getId());
                e.printStackTrace();
                throw new RuntimeException("Error enriching project data", e);
            }
        }).toList();
    }

    /* Create a new project */
    @SuppressWarnings("unchecked")
    public Map<String, Object> create(NewProjectRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<NewProjectRequest> entity = new HttpEntity<>(req, headers);
        
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp =
                restTemplate.postForEntity(baseUrl + "/project/", entity, Map.class);
        return (Map<String, Object>) resp.getBody();
    }

    /* Get project by ID (with collaborators and owner) */
    public ProjectDto getProjectById(UUID projectId) {
        ResponseEntity<ProjectDto> resp =
                restTemplate.getForEntity(baseUrl + "/project/" + projectId.toString(), ProjectDto.class);
        return resp.getBody();
    }

    /* Update project details (title and/or description) */
    @SuppressWarnings("unchecked")
    public Map<String, Object> updateProject(UUID projectId, UpdateProjectRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<UpdateProjectRequest> entity = new HttpEntity<>(req, headers);
        
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp = restTemplate.exchange(
                baseUrl + "/project/" + projectId.toString(),
                HttpMethod.PUT,
                entity,
                Map.class
        );
        return (Map<String, Object>) resp.getBody();
    }

    /* Update collaborators for a project */
    @SuppressWarnings("unchecked")
    public Map<String, Object> updateCollaborators(UUID projectId, UpdateCollaboratorsRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<UpdateCollaboratorsRequest> entity = new HttpEntity<>(req, headers);
        
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp = restTemplate.exchange(
                baseUrl + "/project/" + projectId.toString() + "/collaborators",
                HttpMethod.PUT,
                entity,
                Map.class
        );
        return (Map<String, Object>) resp.getBody();
    }

    /* Change project owner */
    @SuppressWarnings("unchecked")
    public Map<String, Object> changeOwner(UUID projectId, ChangeOwnerRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<ChangeOwnerRequest> entity = new HttpEntity<>(req, headers);
        
        // Add logging
        System.out.println("[ProjectService] Changing owner for project: " + projectId);
        System.out.println("[ProjectService] New owner ID: " + req.getNewOwnerId());
        
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp = restTemplate.exchange(
                baseUrl + "/project/" + projectId.toString() + "/owner",
                HttpMethod.PUT,
                entity,
                Map.class
        );
        return (Map<String, Object>) resp.getBody();
    }

    /* Delete a project */
    @SuppressWarnings("unchecked")
    public Map<String, Object> deleteProject(UUID projectId) {
        @SuppressWarnings("rawtypes")
        ResponseEntity<Map> resp = restTemplate.exchange(
                baseUrl + "/project/" + projectId.toString(),
                HttpMethod.DELETE,
                null,
                Map.class
        );
        return (Map<String, Object>) resp.getBody();
    }
}