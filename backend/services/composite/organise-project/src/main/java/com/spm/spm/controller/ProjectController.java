package com.spm.spm.controller;

import com.spm.spm.dto.NewProjectRequest;
import com.spm.spm.dto.ProjectDto;
import com.spm.spm.dto.UpdateCollaboratorsRequest;
import com.spm.spm.dto.UpdateProjectRequest;
import com.spm.spm.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok(projectService.health());
    }

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAll() {
        return ResponseEntity.ok(projectService.getAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProjectDto>> getProjectsByUser(@PathVariable("userId") UUID userId) {
        List<ProjectDto> projects = projectService.getProjectsByUser(userId);
        return ResponseEntity.ok(projects);
    }

    @PostMapping
    public ResponseEntity<ProjectDto> create(@RequestBody NewProjectRequest req) {
        ProjectDto created = projectService.create(req);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}/collaborators")
    public ResponseEntity<Map<String, Object>> updateCollaborators(
            @PathVariable("id") UUID id,
            @RequestBody UpdateCollaboratorsRequest req
    ) {
        Map<String, Object> result = projectService.updateCollaborators(id, req);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable("id") UUID id) {
        ProjectDto project = projectService.getProjectById(id);
        if (project == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProject(
            @PathVariable("id") UUID id,
            @RequestBody UpdateProjectRequest req
    ) {
        Map<String, Object> result = projectService.updateProject(id, req);
        return ResponseEntity.ok(result);
    }
}


