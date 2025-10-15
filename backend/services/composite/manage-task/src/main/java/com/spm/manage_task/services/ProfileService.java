package com.spm.manage_task.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.spm.manage_task.dto.UserDto;

@Service
public class ProfileService {
    private final String profileUrl = "http://profile:3030/user";

    @Autowired
    private RestTemplate restTemplate;

    public UserDto getUserById(String userId) {
        ResponseEntity<UserDto> responseEntity = restTemplate.getForEntity(profileUrl + "/" + userId, UserDto.class);
        return responseEntity.getBody();
    }
}
