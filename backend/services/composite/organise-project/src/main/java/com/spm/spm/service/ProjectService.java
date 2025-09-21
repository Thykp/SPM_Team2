package com.spm.spm.service;

import com.spm.spm.dto.NewProjectRequest;
import com.spm.spm.dto.ProjectDto;
import com.spm.spm.dto.UpdateCollaboratorsRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ProjectService {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ProjectService(RestTemplate restTemplate,
                          @Value("${project.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    @PostConstruct
    public void logBase() {
        System.out.println("[ProjectService] baseUrl = " + baseUrl);
    }

    public String health() {
        ResponseEntity<String> resp = restTemplate.getForEntity(baseUrl + "/project/", String.class);
        return resp.getBody();
    }

    public List<ProjectDto> getAll() {
        ResponseEntity<ProjectDto[]> resp =
                restTemplate.getForEntity(baseUrl + "/project/all", ProjectDto[].class);
        ProjectDto[] body = resp.getBody();
        return body == null ? List.of() : Arrays.asList(body);
    }

    public ProjectDto create(NewProjectRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<NewProjectRequest> entity = new HttpEntity<>(req, headers);
        ResponseEntity<ProjectDto> resp =
                restTemplate.postForEntity(baseUrl + "/project/new", entity, ProjectDto.class);
        return resp.getBody();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> updateCollaborators(UUID projectId, UpdateCollaboratorsRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<UpdateCollaboratorsRequest> entity = new HttpEntity<>(req, headers);
        ResponseEntity<Map> resp = restTemplate.exchange(
                baseUrl + "/project/" + projectId.toString() + "/collaborators",
                HttpMethod.PUT,
                entity,
                Map.class
        );
        return resp.getBody();
    }
}
