package com.spm.spm.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestLogFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        System.out.println("[INCOMING] " + req.getMethod() + " " + req.getRequestURI());
        chain.doFilter(req, res);
        System.out.println("[OUTGOING] " + res.getStatus() + " for " + req.getMethod() + " " + req.getRequestURI());
    }
}
