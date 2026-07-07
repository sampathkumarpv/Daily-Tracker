package com.taskflow.reminder.web;

import com.taskflow.reminder.service.PushSubscriptionService;
import com.taskflow.reminder.service.WebPushService;
import com.taskflow.reminder.web.dto.PushSubscriptionRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for Web Push subscription management.
 * Part of the Reminder Framework module.
 */
@RestController
@RequestMapping("/api/v1/push")
public class PushSubscriptionController {

    private final PushSubscriptionService subscriptionService;
    private final WebPushService webPushService;

    public PushSubscriptionController(
            PushSubscriptionService subscriptionService,
            WebPushService webPushService) {
        this.subscriptionService = subscriptionService;
        this.webPushService = webPushService;
    }

    /**
     * Get VAPID public key for client-side subscription.
     * Client needs this to register with the browser push service.
     */
    @GetMapping("/vapid-public-key")
    public Map<String, Object> getVapidPublicKey() {
        return Map.of(
            "publicKey", webPushService.getVapidPublicKey(),
            "enabled", webPushService.isEnabled()
        );
    }

    /**
     * Register a push subscription.
     */
    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> subscribe(@Valid @RequestBody PushSubscriptionRequest request) {
        subscriptionService.subscribe(request);
        return Map.of("status", "subscribed");
    }

    /**
     * Unsubscribe from push notifications.
     */
    @PostMapping("/unsubscribe")
    public ResponseEntity<Map<String, String>> unsubscribe(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");

        if (endpoint == null || endpoint.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "endpoint required"));
        }

        if (subscriptionService.unsubscribe(endpoint)) {
            return ResponseEntity.ok(Map.of("status", "unsubscribed"));
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Get subscription count.
     */
    @GetMapping("/subscriptions/count")
    public Map<String, Long> getSubscriptionCount() {
        return Map.of("count", subscriptionService.count());
    }
}
