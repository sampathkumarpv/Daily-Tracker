package com.taskflow.reminder.web.dto;

import com.taskflow.reminder.model.Reminder;

/**
 * DTO for Reminder responses.
 * Part of the Reminder Framework module.
 */
public record ReminderDto(
    Long id,
    String entityType,
    Long entityId,
    String label,
    Long dueAt,
    Boolean fired,
    Long firedAt,
    String repeatRule,
    Long createdAt,
    Long updatedAt
) {
    public static ReminderDto from(Reminder r) {
        return new ReminderDto(
            r.getId(),
            r.getEntityType(),
            r.getEntityId(),
            r.getLabel(),
            r.getDueAt(),
            r.getFired(),
            r.getFiredAt(),
            r.getRepeatRule(),
            r.getCreatedAt(),
            r.getUpdatedAt()
        );
    }
}
