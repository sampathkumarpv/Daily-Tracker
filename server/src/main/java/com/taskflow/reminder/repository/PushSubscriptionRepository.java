package com.taskflow.reminder.repository;

import com.taskflow.reminder.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PushSubscription entity.
 * Part of the Reminder Framework module.
 */
@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    /** Find all subscriptions */
    List<PushSubscription> findAll();

    /** Find subscription by endpoint */
    Optional<PushSubscription> findByEndpoint(String endpoint);

    /** Check if subscription exists */
    boolean existsByEndpoint(String endpoint);

    /** Delete subscription by endpoint */
    @Modifying
    void deleteByEndpoint(String endpoint);
}
