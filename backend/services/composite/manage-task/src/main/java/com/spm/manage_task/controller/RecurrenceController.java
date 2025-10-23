package com.spm.manage_task.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spm.manage_task.dto.RecurrenceDto;
import com.spm.manage_task.services.RecurrenceService;

@RestController
@RequestMapping("api/recurrence")
public class RecurrenceController {

    private final RecurrenceService recurrenceService;

    public RecurrenceController(RecurrenceService recurrenceService) {
        this.recurrenceService = recurrenceService;
    }

    // GET a specific recurrence by ID
    @GetMapping("/{recurrenceId}")
    public ResponseEntity<RecurrenceDto> getRecurrenceById(@PathVariable String recurrenceId) {
        RecurrenceDto recurrence = recurrenceService.getRecurrenceById(recurrenceId);
        return ResponseEntity.ok(recurrence);
    }

    // GET all recurrences for a specific task
    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<RecurrenceDto>> getRecurrencesByTaskId(@PathVariable String taskId) {
        List<RecurrenceDto> recurrences = recurrenceService.getRecurrencesByTaskId(taskId);
        return ResponseEntity.ok(recurrences);
    }

    // POST to create a new recurrence
    @PostMapping("/")
    public ResponseEntity<String> createRecurrence(@RequestBody RecurrenceDto recurrenceDto) {
        System.out.println("Payload received in composite controller (createRecurrence): " + recurrenceDto);
        recurrenceService.createRecurrence(recurrenceDto);
        return ResponseEntity.status(201).body("Recurrence created successfully");
    }

    // PUT to update an existing recurrence
    @PutMapping("/{recurrenceId}")
    public ResponseEntity<String> updateRecurrence(@PathVariable String recurrenceId, @RequestBody RecurrenceDto recurrenceDto) {
        recurrenceService.updateRecurrence(recurrenceId, recurrenceDto);
        return ResponseEntity.ok("Recurrence updated successfully");
    }

    // DELETE a recurrence by ID
    @DeleteMapping("/{recurrenceId}")
    public ResponseEntity<String> deleteRecurrence(@PathVariable String recurrenceId) {
        recurrenceService.deleteRecurrence(recurrenceId);
        return ResponseEntity.ok("Recurrence deleted successfully");
    }
}