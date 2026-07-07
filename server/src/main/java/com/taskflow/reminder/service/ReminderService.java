package com.taskflow.reminder.service;

import com.taskflow.reminder.model.Reminder;
import com.taskflow.reminder.repository.ReminderRepository;
import com.taskflow.reminder.web.dto.CreateReminderRequest;
import com.taskflow.reminder.web.dto.UpdateReminderRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Core reminder service - handles CRUD operations and scheduled reminder checks.
 * Coordinates with SSE and Web Push services for notification delivery.
 *
 * Part of the Reminder Framework module.
 */
@Service
public class ReminderService {

    private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

    private final ReminderRepository reminderRepository;
    private final SseEmitterService sseEmitterService;
    private final WebPushService webPushService;

    public ReminderService(
            ReminderRepository reminderRepository,
            SseEmitterService sseEmitterService,
            WebPushService webPushService) {
        this.reminderRepository = reminderRepository;
        this.sseEmitterService = sseEmitterService;
        this.webPushService = webPushService;
    }

    // ==================== CRUD Operations ====================

    /**
     * Create a new reminder.
     */
    @Transactional
    public Reminder create(CreateReminderRequest request) {
        Reminder reminder = Reminder.create(
            request.entityType(),
            request.entityId(),
            request.label(),
            request.dueAt()
        );

        if (request.repeatRule() != null) {
            reminder.setRepeatRule(request.repeatRule());
        }

        return reminderRepository.save(reminder);
    }

    /**
     * Get a reminder by ID.
     */
    public Optional<Reminder> findById(Long id) {
        return reminderRepository.findById(id);
    }

    /**
     * Get all reminders.
     */
    public List<Reminder> findAll() {
        return reminderRepository.findAllByOrderByDueAtAsc();
    }

    /**
     * Get reminders for a specific entity.
     */
    public List<Reminder> findByEntity(String entityType, Long entityId) {
        return reminderRepository.findByEntityTypeAndEntityId(entityType, entityId);
    }

    /**
     * Get pending (unfired) reminders.
     */
    public List<Reminder> findPending() {
        return reminderRepository.findByFiredFalseOrderByDueAtAsc();
    }

    /**
     * Count pending reminders.
     */
    public long countPending() {
        return reminderRepository.countByFiredFalse();
    }

    /**
     * Update a reminder.
     */
    @Transactional
    public Optional<Reminder> update(Long id, UpdateReminderRequest request) {
        return findById(id).map(reminder -> {
            if (request.label() != null) {
                reminder.setLabel(request.label());
            }
            if (request.dueAt() != null) {
                reminder.setDueAt(request.dueAt());
                // Unfired if due date is updated to future
                if (request.dueAt() > System.currentTimeMillis()) {
                    reminder.setFired(false);
                    reminder.setFiredAt(null);
                }
            }
            if (request.repeatRule() != null) {
                reminder.setRepeatRule(request.repeatRule());
            }
            return reminderRepository.save(reminder);
        });
    }

    /**
     * Delete a reminder.
     */
    @Transactional
    public boolean delete(Long id) {
        return findById(id).map(reminder -> {
            reminderRepository.delete(reminder);
            return true;
        }).orElse(false);
    }

    /**
     * Delete all reminders for an entity (cascade delete).
     */
    @Transactional
    public void deleteByEntity(String entityType, Long entityId) {
        reminderRepository.deleteByEntity(entityType, entityId);
    }

    // ==================== Scheduler ====================

    /**
     * Scheduled job to check for due reminders.
     * Runs every minute and fires notifications for any due reminders.
     */
    @Scheduled(fixedRate = 60000)  // Every 60 seconds
    @Transactional
    public void checkDueReminders() {
        long now = System.currentTimeMillis();
        List<Reminder> dueReminders = reminderRepository.findDueReminders(now);

        if (dueReminders.isEmpty()) {
            return;
        }

        log.info("Found {} due reminders", dueReminders.size());

        for (Reminder reminder : dueReminders) {
            fireReminder(reminder);
        }
    }

    /**
     * Fire a reminder - mark as fired and send notifications.
     */
    @Transactional
    public void fireReminder(Reminder reminder) {
        log.info("Firing reminder {}: {}", reminder.getId(), reminder.getLabel());

        // Mark as fired
        reminder.markFired();
        reminderRepository.save(reminder);

        // Send via SSE to connected clients
        sseEmitterService.sendReminder(reminder);

        // Send via Web Push for offline/background clients
        webPushService.sendReminderNotification(reminder);

        // Handle repeat rule if present
        handleRepeat(reminder);
    }

    /**
     * Handle repeating reminders by creating next occurrence.
     */
    private void handleRepeat(Reminder fired) {
        if (fired.getRepeatRule() == null || fired.getRepeatRule().isEmpty()) {
            return;
        }

        Long nextDueAt = calculateNextDueAt(fired.getDueAt(), fired.getRepeatRule());
        if (nextDueAt == null) {
            return;
        }

        Reminder next = Reminder.create(
            fired.getEntityType(),
            fired.getEntityId(),
            fired.getLabel(),
            nextDueAt
        );
        next.setRepeatRule(fired.getRepeatRule());

        reminderRepository.save(next);
        log.info("Created repeating reminder {} for {}", next.getId(), fired.getRepeatRule());
    }

    private Long calculateNextDueAt(Long current, String rule) {
        long day = 24 * 60 * 60 * 1000L;

        return switch (rule.toLowerCase()) {
            case "daily" -> current + day;
            case "weekly" -> current + (7 * day);
            case "monthly" -> current + (30 * day);  // Approximate
            default -> {
                // Could implement RRULE parsing here for complex recurrence
                log.debug("Unknown repeat rule: {}", rule);
                yield null;
            }
        };
    }

    /**
     * Manually trigger a reminder check (for testing/debugging).
     */
    public void triggerCheck() {
        checkDueReminders();
    }
}
