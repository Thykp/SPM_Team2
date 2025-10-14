package com.spm.spm.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spm.spm.dto.ChangeOwnerRequest;
import com.spm.spm.dto.NewProjectRequest;
import com.spm.spm.dto.ProjectDto;
import com.spm.spm.dto.UpdateCollaboratorsRequest;
import com.spm.spm.dto.UpdateProjectRequest;
import com.spm.spm.service.ProjectService;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Health check endpoint
     * GET /api/v1/projects/health
     */
    @GetMapping
    public ResponseEntity<String> health() {
        String result = projectService.health();
        return ResponseEntity.ok(result);
    }

    /**
     * Get all projects
     * GET /api/v1/projects
     */
    @GetMapping("/all")
    public ResponseEntity<List<ProjectDto>> getAllProjects() {
        List<ProjectDto> projects = projectService.getAll();
        return ResponseEntity.ok(projects);
    }

    /**
     * Get all projects for a specific user (owner or collaborator)
     * GET /api/v1/projects/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProjectDto>> getProjectsByUser(@PathVariable UUID userId) {
        List<ProjectDto> projects = projectService.getProjectsByUser(userId);
        return ResponseEntity.ok(projects);
    }

    /**
     * Get a specific project by ID (with collaborators)
     * GET /api/v1/projects/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable UUID id) {
        ProjectDto project = projectService.getProjectById(id);
        if (project == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(project);
    }

    /**
     * Create a new project
     * POST /api/v1/projects
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createProject(@RequestBody NewProjectRequest request) {
        Map<String, Object> result = projectService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Update project details (title and/or description)
     * PUT /api/v1/projects/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProject(
            @PathVariable UUID id,
            @RequestBody UpdateProjectRequest request) {
        Map<String, Object> result = projectService.updateProject(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * Update collaborators for a project
     * PUT /api/v1/projects/{id}/collaborators
     */
    @PutMapping("/{id}/collaborators")
    public ResponseEntity<Map<String, Object>> updateCollaborators(
            @PathVariable UUID id,
            @RequestBody UpdateCollaboratorsRequest request) {
        Map<String, Object> result = projectService.updateCollaborators(id, request);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/owner")
    public ResponseEntity<Map<String, Object>> changeOwner(
            @PathVariable UUID id,
            @RequestBody ChangeOwnerRequest request) {
        Map<String, Object> result = projectService.changeOwner(id, request);
        return ResponseEntity.ok(result);
    }

    /**
     * Delete a project
     * DELETE /api/v1/projects/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProject(@PathVariable UUID id) {
        Map<String, Object> result = projectService.deleteProject(id);
        return ResponseEntity.ok(result);
    }
}