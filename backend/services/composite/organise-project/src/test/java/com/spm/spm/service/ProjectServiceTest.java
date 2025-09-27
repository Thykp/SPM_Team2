package com.spm.spm.service;

import com.spm.spm.dto.NewProjectRequest;
import com.spm.spm.dto.ProjectDto;
import com.spm.spm.dto.UpdateProjectRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.OffsetDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService - create() method tests")
class ProjectServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private ProjectService projectService;
    
    private final String baseUrl = "http://project:3040";
    
    private UUID testProjectId;
    private UUID testOwnerId;
    private UUID testCollaboratorId;
    private UUID testTaskId1;
    private UUID testTaskId2;

    @BeforeEach
    void setUp() {
        // Initialize the service with mocked dependencies
        projectService = new ProjectService(restTemplate, baseUrl);
        
        // Initialize test UUIDs
        testProjectId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        testOwnerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        testCollaboratorId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        testTaskId1 = UUID.fromString("44444444-4444-4444-4444-444444444444");
        testTaskId2 = UUID.fromString("55555555-5555-5555-5555-555555555555");
    }

    // Test: Verify successful project creation with all fields populated returns correct ProjectDto
    @Test
    @DisplayName("Should successfully create project with all fields populated")
    void create_withCompleteRequest_shouldReturnProjectDto() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "Test Project",
            "Test Description",
            Arrays.asList(testTaskId1, testTaskId2),
            testOwnerId,
            Arrays.asList(testCollaboratorId)
        );
        
        ProjectDto expectedResponse = new ProjectDto(
            testProjectId,
            OffsetDateTime.now(),
            "Test Project",
            Arrays.asList(testTaskId1, testTaskId2),
            "Test Description",
            testOwnerId,
            Arrays.asList(testCollaboratorId)
        );
        
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.CREATED);
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        ProjectDto result = projectService.create(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testProjectId);
        assertThat(result.getTitle()).isEqualTo("Test Project");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getOwner()).isEqualTo(testOwnerId);
        assertThat(result.getCollaborators()).containsExactly(testCollaboratorId);
        assertThat(result.getTaskList()).containsExactly(testTaskId1, testTaskId2);
        assertThat(result.getCreatedAt()).isNotNull();
    }

    // Test: Verify project creation works with only required fields and empty collections
    @Test
    @DisplayName("Should successfully create project with minimal required fields")
    void create_withMinimalRequest_shouldReturnProjectDto() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "Minimal Project",
            "Minimal Description",
            Collections.emptyList(),
            testOwnerId,
            Collections.emptyList()
        );
        
        ProjectDto expectedResponse = new ProjectDto(
            testProjectId,
            OffsetDateTime.now(),
            "Minimal Project",
            Collections.emptyList(),
            "Minimal Description",
            testOwnerId,
            Collections.emptyList()
        );
        
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.CREATED);
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        ProjectDto result = projectService.create(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testProjectId);
        assertThat(result.getTitle()).isEqualTo("Minimal Project");
        assertThat(result.getDescription()).isEqualTo("Minimal Description");
        assertThat(result.getOwner()).isEqualTo(testOwnerId);
        assertThat(result.getCollaborators()).isEmpty();
        assertThat(result.getTaskList()).isEmpty();
    }

    // Test: Verify HTTP request contains correct headers (Content-Type) and request body data
    @Test
    @DisplayName("Should send correct HTTP headers and request body")
    @SuppressWarnings("unchecked")
    void create_shouldSendCorrectHttpRequest() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "Header Test Project",
            "Testing headers",
            Arrays.asList(testTaskId1),
            testOwnerId,
            Arrays.asList(testCollaboratorId)
        );
        
        ProjectDto mockResponse = new ProjectDto();
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(mockResponse, HttpStatus.CREATED);
        
        ArgumentCaptor<HttpEntity<NewProjectRequest>> httpEntityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            httpEntityCaptor.capture(),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        projectService.create(request);

        // Assert
        HttpEntity<NewProjectRequest> capturedEntity = httpEntityCaptor.getValue();
        
        // Verify headers
        assertThat(capturedEntity.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        
        // Verify request body
        NewProjectRequest capturedBody = capturedEntity.getBody();
        assertThat(capturedBody).isNotNull();
        assertThat(capturedBody.getTitle()).isEqualTo("Header Test Project");
        assertThat(capturedBody.getDescription()).isEqualTo("Testing headers");
        assertThat(capturedBody.getOwner()).isEqualTo(testOwnerId);
        assertThat(capturedBody.getCollaborators()).containsExactly(testCollaboratorId);
        assertThat(capturedBody.getTaskList()).containsExactly(testTaskId1);
    }

    // Test: Verify service handles null HTTP response body without throwing exception
    @Test
    @DisplayName("Should handle null response body gracefully")
    void create_withNullResponseBody_shouldReturnNull() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "Null Response Test",
            "Testing null response",
            Collections.emptyList(),
            testOwnerId,
            Collections.emptyList()
        );
        
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(null, HttpStatus.CREATED);
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        ProjectDto result = projectService.create(request);

        // Assert
        assertThat(result).isNull();
    }

    // Test: Verify RestClientException is properly propagated when HTTP call fails
    @Test
    @DisplayName("Should propagate RestClientException when HTTP call fails")
    void create_whenRestTemplateFails_shouldThrowException() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "Failed Request",
            "This should fail",
            Collections.emptyList(),
            testOwnerId,
            Collections.emptyList()
        );
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenThrow(new RestClientException("Connection failed"));

        // Act & Assert
        assertThatThrownBy(() -> projectService.create(request))
            .isInstanceOf(RestClientException.class)
            .hasMessage("Connection failed");
    }

    // Test: Verify service handles null task list in request without errors
    @Test
    @DisplayName("Should handle request with null task list")
    void create_withNullTaskList_shouldHandleGracefully() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "Null Task List Project",
            "Testing null task list",
            null, // null task list
            testOwnerId,
            Arrays.asList(testCollaboratorId)
        );
        
        ProjectDto expectedResponse = new ProjectDto(
            testProjectId,
            OffsetDateTime.now(),
            "Null Task List Project",
            null,
            "Testing null task list",
            testOwnerId,
            Arrays.asList(testCollaboratorId)
        );
        
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.CREATED);
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        ProjectDto result = projectService.create(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTaskList()).isNull();
        
        // Verify the service still processes the request correctly
        verify(restTemplate).postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        );
    }

    // Test: Verify service handles null collaborators list in request without errors
    @Test
    @DisplayName("Should handle request with null collaborators")
    void create_withNullCollaborators_shouldHandleGracefully() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "Null Collaborators Project",
            "Testing null collaborators",
            Arrays.asList(testTaskId1),
            testOwnerId,
            null // null collaborators
        );
        
        ProjectDto expectedResponse = new ProjectDto(
            testProjectId,
            OffsetDateTime.now(),
            "Null Collaborators Project",
            Arrays.asList(testTaskId1),
            "Testing null collaborators",
            testOwnerId,
            null
        );
        
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.CREATED);
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        ProjectDto result = projectService.create(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getCollaborators()).isNull();
        
        // Verify the service still processes the request correctly
        verify(restTemplate).postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        );
    }

    // Test: Verify service calls the correct API endpoint URL
    @Test
    @DisplayName("Should verify correct URL is called")
    void create_shouldCallCorrectUrl() {
        // Arrange
        NewProjectRequest request = new NewProjectRequest(
            "URL Test Project",
            "Testing URL",
            Collections.emptyList(),
            testOwnerId,
            Collections.emptyList()
        );
        
        ProjectDto mockResponse = new ProjectDto();
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(mockResponse, HttpStatus.CREATED);
        
        when(restTemplate.postForEntity(
            anyString(),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        projectService.create(request);

        // Assert
        verify(restTemplate).postForEntity(
            eq("http://project:3040/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        );
    }

    // Test: Verify service correctly handles large collections without performance issues
    @Test
    @DisplayName("Should handle large task list and collaborators list")
    void create_withLargeLists_shouldHandleCorrectly() {
        // Arrange
        List<UUID> largeTasks = Arrays.asList(
            testTaskId1, testTaskId2,
            UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()
        );
        
        List<UUID> largeCollaborators = Arrays.asList(
            testCollaboratorId,
            UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()
        );
        
        NewProjectRequest request = new NewProjectRequest(
            "Large Lists Project",
            "Testing large lists",
            largeTasks,
            testOwnerId,
            largeCollaborators
        );
        
        ProjectDto expectedResponse = new ProjectDto(
            testProjectId,
            OffsetDateTime.now(),
            "Large Lists Project",
            largeTasks,
            "Testing large lists",
            testOwnerId,
            largeCollaborators
        );
        
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.CREATED);
        
        when(restTemplate.postForEntity(
            eq(baseUrl + "/project/new"),
            any(HttpEntity.class),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        ProjectDto result = projectService.create(request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTaskList()).hasSize(5);
        assertThat(result.getCollaborators()).hasSize(4);
        assertThat(result.getTaskList()).containsAll(largeTasks);
        assertThat(result.getCollaborators()).containsAll(largeCollaborators);
    }

    @Test
    @DisplayName("Should successfully get project by ID")
    void getProjectById_shouldReturnProjectDto() {
        // Arrange
        ProjectDto expectedResponse = new ProjectDto(
            testProjectId,
            OffsetDateTime.now(),
            "Test Project",
            Arrays.asList(testTaskId1, testTaskId2),
            "Test Description",
            testOwnerId,
            Arrays.asList(testCollaboratorId)
        );
        
        ResponseEntity<ProjectDto> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.OK);
        
        when(restTemplate.getForEntity(
            eq(baseUrl + "/project/" + testProjectId.toString()),
            eq(ProjectDto.class)
        )).thenReturn(responseEntity);

        // Act
        ProjectDto result = projectService.getProjectById(testProjectId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testProjectId);
        assertThat(result.getTitle()).isEqualTo("Test Project");
        assertThat(result.getDescription()).isEqualTo("Test Description");
    }

    @Test
    @DisplayName("Should successfully update project")
    @SuppressWarnings("unchecked")
    void updateProject_shouldReturnUpdatedProject() {
        // Arrange
        UpdateProjectRequest updateRequest = new UpdateProjectRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setDescription("Updated Description");
        
        Map<String, Object> projectMap = new HashMap<>();
        projectMap.put("id", testProjectId.toString());
        projectMap.put("title", "Updated Title");
        projectMap.put("description", "Updated Description");
        
        Map<String, Object> expectedResponse = new HashMap<>();
        expectedResponse.put("success", true);
        expectedResponse.put("project", projectMap);
        
        ResponseEntity<Map<String, Object>> responseEntity = new ResponseEntity<>(expectedResponse, HttpStatus.OK);
        
        ArgumentCaptor<HttpEntity<UpdateProjectRequest>> httpEntityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        
        when(restTemplate.exchange(
            eq(baseUrl + "/project/" + testProjectId.toString()),
            eq(HttpMethod.PUT),
            httpEntityCaptor.capture(),
            eq(Map.class)
        )).thenReturn((ResponseEntity) responseEntity);

        // Act
        Map<String, Object> result = projectService.updateProject(testProjectId, updateRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        
        // Verify headers
        HttpEntity<UpdateProjectRequest> capturedEntity = httpEntityCaptor.getValue();
        assertThat(capturedEntity.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
        
        // Verify request body
        UpdateProjectRequest capturedBody = capturedEntity.getBody();
        assertThat(capturedBody).isNotNull();
        assertThat(capturedBody.getTitle()).isEqualTo("Updated Title");
        assertThat(capturedBody.getDescription()).isEqualTo("Updated Description");
    }
}