package com.taskflow.reminder.model;

import jakarta.persistence.*;

/**
 * Web Push subscription storage.
 * Stores browser push endpoints for sending notifications when app is closed.
 */
@Entity
@Table(name = "\"PushSubscription\"", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"endpoint"})
})
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Push service endpoint URL (e.g., https://fcm.googleapis.com/fcm/send/...) */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    /** P-256 Diffie-Hellman public key for encryption */
    @Column(name = "\"p256dhKey\"", nullable = false, columnDefinition = "TEXT")
    private String p256dhKey;

    /** Auth secret for encryption */
    @Column(name = "\"authKey\"", nullable = false, columnDefinition = "TEXT")
    private String authKey;

    /** Browser user agent (for debugging) */
    @Column(name = "\"userAgent\"", length = 500)
    private String userAgent;

    @Column(name = "\"createdAt\"", nullable = false)
    private Long createdAt;

    public PushSubscription() {
        this.createdAt = System.currentTimeMillis();
    }

    public static PushSubscription create(String endpoint, String p256dhKey, String authKey) {
        PushSubscription sub = new PushSubscription();
        sub.setEndpoint(endpoint);
        sub.setP256dhKey(p256dhKey);
        sub.setAuthKey(authKey);
        return sub;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getP256dhKey() { return p256dhKey; }
    public void setP256dhKey(String p256dhKey) { this.p256dhKey = p256dhKey; }

    public String getAuthKey() { return authKey; }
    public void setAuthKey(String authKey) { this.authKey = authKey; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }
}
