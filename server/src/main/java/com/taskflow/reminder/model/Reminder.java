package com.taskflow.reminder.model;

import jakarta.persistence.*;

/**
 * Reminder entity - standalone reminder framework.
 * Uses polymorphic association via entityType + entityId to attach to any entity.
 */
@Entity
@Table(name = "\"Reminder\"", indexes = {
    @Index(name = "idx_Reminder_entity", columnList = "\"entityType\", \"entityId\""),
    @Index(name = "idx_Reminder_due", columnList = "fired, \"dueAt\"")
})
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Entity type for polymorphic association: 'task', 'notecard', 'notebook', etc. */
    @Column(name = "\"entityType\"", nullable = false, length = 50)
    private String entityType;

    /** Entity ID (Long as string for flexibility) */
    @Column(name = "\"entityId\"", nullable = false)
    private Long entityId;

    @Column(nullable = false, length = 500)
    private String label;

    /** When the reminder should fire (milliseconds since epoch) */
    @Column(name = "\"dueAt\"", nullable = false)
    private Long dueAt;

    @Column(nullable = false)
    private Boolean fired = false;

    /** When the reminder actually fired (milliseconds since epoch) */
    @Column(name = "\"firedAt\"")
    private Long firedAt;

    /** Recurrence rule: 'daily', 'weekly', 'monthly', or RRULE format */
    @Column(name = "\"repeatRule\"", length = 255)
    private String repeatRule;

    @Column(name = "\"createdAt\"", nullable = false)
    private Long createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private Long updatedAt;

    public Reminder() {
        long now = System.currentTimeMillis();
        this.createdAt = now;
        this.updatedAt = now;
        this.fired = false;
    }

    // Factory method for cleaner creation
    public static Reminder create(String entityType, Long entityId, String label, Long dueAt) {
        Reminder r = new Reminder();
        r.setEntityType(entityType);
        r.setEntityId(entityId);
        r.setLabel(label);
        r.setDueAt(dueAt);
        return r;
    }

    /** Mark this reminder as fired */
    public void markFired() {
        this.fired = true;
        this.firedAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
    }

    /** Check if this reminder is due */
    public boolean isDue() {
        return !fired && dueAt <= System.currentTimeMillis();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public Long getDueAt() { return dueAt; }
    public void setDueAt(Long dueAt) { this.dueAt = dueAt; }

    public Boolean getFired() { return fired; }
    public void setFired(Boolean fired) { this.fired = fired; }

    public Long getFiredAt() { return firedAt; }
    public void setFiredAt(Long firedAt) { this.firedAt = firedAt; }

    public String getRepeatRule() { return repeatRule; }
    public void setRepeatRule(String repeatRule) { this.repeatRule = repeatRule; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
