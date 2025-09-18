package com.spm.spm.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class HttpClientConfig {
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate rt = new RestTemplate();
        rt.getInterceptors().add((req, body, exec) -> {
            System.out.println("[RestTemplate] " + req.getMethod() + " " + req.getURI());
            return exec.execute(req, body);
        });
        return rt;
    }
}
