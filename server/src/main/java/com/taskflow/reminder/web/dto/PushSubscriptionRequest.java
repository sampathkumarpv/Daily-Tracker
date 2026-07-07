package com.taskflow.reminder.web.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for registering a Web Push subscription.
 * Part of the Reminder Framework module.
 */
public record PushSubscriptionRequest(
    @NotBlank String endpoint,
    @NotBlank String p256dhKey,
    @NotBlank String authKey,
    String userAgent  // Optional
) {}
