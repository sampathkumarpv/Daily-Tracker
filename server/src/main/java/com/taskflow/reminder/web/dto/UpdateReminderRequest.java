package com.taskflow.reminder.web.dto;

/**
 * Request DTO for updating a reminder.
 * All fields are optional - only non-null fields will be updated.
 * Part of the Reminder Framework module.
 */
public record UpdateReminderRequest(
    String label,
    Long dueAt,
    String repeatRule
) {}
