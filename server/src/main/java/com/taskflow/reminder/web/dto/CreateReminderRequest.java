package com.taskflow.reminder.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for creating a reminder.
 * Part of the Reminder Framework module.
 */
public record CreateReminderRequest(
    @NotBlank String entityType,
    @NotNull Long entityId,
    @NotBlank String label,
    @NotNull Long dueAt,
    String repeatRule  // Optional: 'daily', 'weekly', 'monthly', or RRULE
) {}
