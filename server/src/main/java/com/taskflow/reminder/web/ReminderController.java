package com.taskflow.reminder.web;

import com.taskflow.reminder.model.Reminder;
import com.taskflow.reminder.service.ReminderService;
import com.taskflow.reminder.service.SseEmitterService;
import com.taskflow.reminder.web.dto.CreateReminderRequest;
import com.taskflow.reminder.web.dto.ReminderDto;
import com.taskflow.reminder.web.dto.UpdateReminderRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/**
 * REST controller for Reminder operations.
 * Includes SSE endpoint for real-time notifications.
 *
 * Part of the Reminder Framework module.
 */
@RestController
@RequestMapping("/api/v1/reminders")
public class ReminderController {

    private final ReminderService reminderService;
    private final SseEmitterService sseEmitterService;

    public ReminderController(ReminderService reminderService, SseEmitterService sseEmitterService) {
        this.reminderService = reminderService;
        this.sseEmitterService = sseEmitterService;
    }

    // ==================== SSE Endpoint ====================

    /**
     * SSE stream for real-time reminder notifications.
     * Client connects here to receive push notifications when reminders fire.
     */
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return sseEmitterService.createEmitter();
    }

    // ==================== CRUD Endpoints ====================

    /**
     * Get all reminders.
     */
    @GetMapping
    public List<ReminderDto> list() {
        return reminderService.findAll()
            .stream()
            .map(ReminderDto::from)
            .toList();
    }

    /**
     * Get pending (unfired) reminders.
     */
    @GetMapping("/pending")
    public List<ReminderDto> listPending() {
        return reminderService.findPending()
            .stream()
            .map(ReminderDto::from)
            .toList();
    }

    /**
     * Get count of pending reminders.
     */
    @GetMapping("/pending/count")
    public Map<String, Long> countPending() {
        return Map.of("count", reminderService.countPending());
    }

    /**
     * Get reminders for a specific entity.
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public List<ReminderDto> listByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        return reminderService.findByEntity(entityType, entityId)
            .stream()
            .map(ReminderDto::from)
            .toList();
    }

    /**
     * Get a single reminder by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReminderDto> get(@PathVariable Long id) {
        return reminderService.findById(id)
            .map(ReminderDto::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new reminder.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReminderDto create(@Valid @RequestBody CreateReminderRequest request) {
        Reminder reminder = reminderService.create(request);
        return ReminderDto.from(reminder);
    }

    /**
     * Update a reminder.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ReminderDto> update(
            @PathVariable Long id,
            @RequestBody UpdateReminderRequest request) {
        return reminderService.update(id, request)
            .map(ReminderDto::from)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Delete a reminder.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (reminderService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Delete all reminders for an entity (internal use for cascade delete).
     */
    @DeleteMapping("/entity/{entityType}/{entityId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {
        reminderService.deleteByEntity(entityType, entityId);
    }
}
