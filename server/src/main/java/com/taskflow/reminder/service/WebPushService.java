package com.taskflow.reminder.service;

import com.taskflow.reminder.model.PushSubscription;
import com.taskflow.reminder.model.Reminder;
import com.taskflow.reminder.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;

/**
 * Web Push notification service for sending browser push notifications.
 * Uses VAPID (Voluntary Application Server Identification) for authentication.
 *
 * Part of the Reminder Framework module.
 */
@Service
public class WebPushService {

    private static final Logger log = LoggerFactory.getLogger(WebPushService.class);

    private final PushSubscriptionRepository subscriptionRepository;

    @Value("${reminder.vapid.public-key:}")
    private String vapidPublicKey;

    @Value("${reminder.vapid.private-key:}")
    private String vapidPrivateKey;

    @Value("${reminder.vapid.subject:mailto:admin@taskflow.com}")
    private String vapidSubject;

    private PushService pushService;
    private boolean enabled = false;

    public WebPushService(PushSubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @PostConstruct
    public void init() {
        // Add BouncyCastle security provider
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        // Initialize push service if VAPID keys are configured
        if (vapidPublicKey != null && !vapidPublicKey.isEmpty()
                && vapidPrivateKey != null && !vapidPrivateKey.isEmpty()) {
            try {
                pushService = new PushService();
                pushService.setPublicKey(vapidPublicKey);
                pushService.setPrivateKey(vapidPrivateKey);
                pushService.setSubject(vapidSubject);
                enabled = true;
                log.info("Web Push service initialized successfully");
            } catch (GeneralSecurityException e) {
                log.error("Failed to initialize Web Push service: {}", e.getMessage());
            }
        } else {
            log.warn("Web Push service disabled - VAPID keys not configured");
        }
    }

    /**
     * Check if Web Push is enabled (VAPID keys configured).
     */
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Get the VAPID public key for client registration.
     */
    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    /**
     * Send a push notification for a reminder to all subscribed browsers.
     */
    public void sendReminderNotification(Reminder reminder) {
        if (!enabled) {
            log.debug("Web Push disabled, skipping notification");
            return;
        }

        List<PushSubscription> subscriptions = subscriptionRepository.findAll();

        if (subscriptions.isEmpty()) {
            log.debug("No push subscriptions found");
            return;
        }

        String payload = buildPayload(reminder);

        for (PushSubscription sub : subscriptions) {
            sendPush(sub, payload);
        }
    }

    /**
     * Send a custom push notification to all subscriptions.
     */
    public void sendNotification(String title, String body) {
        if (!enabled) return;

        List<PushSubscription> subscriptions = subscriptionRepository.findAll();

        String payload = String.format(
            "{\"title\":\"%s\",\"body\":\"%s\",\"type\":\"custom\"}",
            escapeJson(title),
            escapeJson(body)
        );

        for (PushSubscription sub : subscriptions) {
            sendPush(sub, payload);
        }
    }

    private void sendPush(PushSubscription sub, String payload) {
        try {
            Notification notification = new Notification(
                sub.getEndpoint(),
                sub.getP256dhKey(),
                sub.getAuthKey(),
                payload.getBytes()
            );

            pushService.send(notification);
            log.debug("Push sent to endpoint: {}...", sub.getEndpoint().substring(0, 50));

        } catch (Exception e) {
            log.warn("Failed to send push notification: {}", e.getMessage());
            // If the subscription is invalid (410 Gone), remove it
            if (e.getMessage() != null && e.getMessage().contains("410")) {
                log.info("Removing invalid subscription: {}", sub.getId());
                subscriptionRepository.delete(sub);
            }
        }
    }

    private String buildPayload(Reminder reminder) {
        return String.format(
            "{\"title\":\"Reminder\",\"body\":\"%s\",\"type\":\"reminder\",\"reminderId\":%d,\"entityType\":\"%s\",\"entityId\":%d}",
            escapeJson(reminder.getLabel()),
            reminder.getId(),
            reminder.getEntityType(),
            reminder.getEntityId()
        );
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
