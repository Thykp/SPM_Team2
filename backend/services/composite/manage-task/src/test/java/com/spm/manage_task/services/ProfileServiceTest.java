package com.spm.manage_task.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.spm.manage_task.dto.UserDto;

@ExtendWith(MockitoExtension.class)
public class ProfileServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ProfileService profileService;

    private UserDto mockUserDto;

    @BeforeEach
    void setUp() {
        // Setup mock UserDto with complete data
        mockUserDto = new UserDto(
            "user123",
            "dept456",
            "team789",
            "John Doe",
            "Developer",
            "Engineering",
            "Backend Team"
        );
    }

    // ===== getUserById() Tests =====

    @Test
    void testGetUserById_Success() {
        // Arrange
        String userId = "user123";
        when(restTemplate.getForEntity(eq("http://profile:3030/user/" + userId), eq(UserDto.class)))
            .thenReturn(new ResponseEntity<>(mockUserDto, HttpStatus.OK));

        // Act
        UserDto result = profileService.getUserById(userId);

        // Assert
        assertNotNull(result);
        assertEquals("user123", result.getUserId());
        assertEquals("John Doe", result.getUserDisplayName());
        assertEquals("Engineering", result.getUserDepartmentName());
        assertEquals("Backend Team", result.getUserTeamName());
        assertEquals("Developer", result.getUserRole());
        assertEquals("dept456", result.getUserDepartmentId());
        assertEquals("team789", result.getUserTeamId());
        verify(restTemplate, times(1)).getForEntity(eq("http://profile:3030/user/" + userId), eq(UserDto.class));
    }

    @Test
    void testGetUserById_NullResponse() {
        // Arrange
        String userId = "user123";
        when(restTemplate.getForEntity(eq("http://profile:3030/user/" + userId), eq(UserDto.class)))
            .thenReturn(new ResponseEntity<>(null, HttpStatus.OK));

        // Act
        UserDto result = profileService.getUserById(userId);

        // Assert
        assertNull(result);
        verify(restTemplate, times(1)).getForEntity(eq("http://profile:3030/user/" + userId), eq(UserDto.class));
    }

    @Test
    void testGetUserById_MinimalUserData() {
        // Arrange
        String userId = "user456";
        UserDto minimalUser = new UserDto(
            "user456",
            null,
            null,
            null,
            null,
            null,
            null
        );
        when(restTemplate.getForEntity(eq("http://profile:3030/user/" + userId), eq(UserDto.class)))
            .thenReturn(new ResponseEntity<>(minimalUser, HttpStatus.OK));

        // Act
        UserDto result = profileService.getUserById(userId);

        // Assert
        assertNotNull(result);
        assertEquals("user456", result.getUserId());
        assertNull(result.getUserDisplayName());
        assertNull(result.getUserDepartmentName());
        assertNull(result.getUserTeamName());
        verify(restTemplate, times(1)).getForEntity(eq("http://profile:3030/user/" + userId), eq(UserDto.class));
    }
}

