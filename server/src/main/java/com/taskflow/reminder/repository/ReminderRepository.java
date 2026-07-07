package com.taskflow.reminder.repository;

import com.taskflow.reminder.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Reminder entity.
 * Part of the Reminder Framework module.
 */
@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    /** Find all reminders ordered by due date */
    List<Reminder> findAllByOrderByDueAtAsc();

    /** Find reminders by entity (polymorphic lookup) */
    List<Reminder> findByEntityTypeAndEntityId(String entityType, Long entityId);

    /** Find unfired reminders that are due (for scheduler) */
    @Query("SELECT r FROM Reminder r WHERE r.fired = false AND r.dueAt <= :now ORDER BY r.dueAt ASC")
    List<Reminder> findDueReminders(@Param("now") Long now);

    /** Find pending (unfired) reminders */
    List<Reminder> findByFiredFalseOrderByDueAtAsc();

    /** Count pending reminders */
    long countByFiredFalse();

    /** Delete all reminders for an entity (cascade delete) */
    @Modifying
    @Query("DELETE FROM Reminder r WHERE r.entityType = :entityType AND r.entityId = :entityId")
    void deleteByEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);
}
