package com.taskflow.reminder.service;

import com.taskflow.reminder.model.PushSubscription;
import com.taskflow.reminder.repository.PushSubscriptionRepository;
import com.taskflow.reminder.web.dto.PushSubscriptionRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing Web Push subscriptions.
 * Part of the Reminder Framework module.
 */
@Service
public class PushSubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(PushSubscriptionService.class);

    private final PushSubscriptionRepository repository;

    public PushSubscriptionService(PushSubscriptionRepository repository) {
        this.repository = repository;
    }

    /**
     * Register or update a push subscription.
     */
    @Transactional
    public PushSubscription subscribe(PushSubscriptionRequest request) {
        // Check if subscription already exists
        Optional<PushSubscription> existing = repository.findByEndpoint(request.endpoint());

        if (existing.isPresent()) {
            // Update existing subscription
            PushSubscription sub = existing.get();
            sub.setP256dhKey(request.p256dhKey());
            sub.setAuthKey(request.authKey());
            if (request.userAgent() != null) {
                sub.setUserAgent(request.userAgent());
            }
            log.debug("Updated push subscription");
            return repository.save(sub);
        }

        // Create new subscription
        PushSubscription sub = PushSubscription.create(
            request.endpoint(),
            request.p256dhKey(),
            request.authKey()
        );
        if (request.userAgent() != null) {
            sub.setUserAgent(request.userAgent());
        }

        log.info("New push subscription registered");
        return repository.save(sub);
    }

    /**
     * Unsubscribe (remove a push subscription).
     */
    @Transactional
    public boolean unsubscribe(String endpoint) {
        if (repository.existsByEndpoint(endpoint)) {
            repository.deleteByEndpoint(endpoint);
            log.info("Push subscription removed");
            return true;
        }
        return false;
    }

    /**
     * Get all subscriptions.
     */
    public List<PushSubscription> findAll() {
        return repository.findAll();
    }

    /**
     * Count subscriptions.
     */
    public long count() {
        return repository.count();
    }
}
