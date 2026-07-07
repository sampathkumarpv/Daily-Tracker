package com.taskflow.reminder.service;

import com.taskflow.reminder.model.Reminder;
import com.taskflow.reminder.web.dto.ReminderDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Server-Sent Events (SSE) emitter service for real-time reminder notifications.
 * Maintains connections and broadcasts reminder events.
 *
 * Part of the Reminder Framework module.
 */
@Service
public class SseEmitterService {

    private static final Logger log = LoggerFactory.getLogger(SseEmitterService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    // List of active emitters
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /**
     * Create a new SSE connection.
     * Client should call GET /api/reminders/stream
     */
    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.add(emitter);

        // Clean up on completion/timeout/error
        Runnable cleanup = () -> {
            emitters.remove(emitter);
            log.debug("SSE connection closed");
        };

        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> {
            log.debug("SSE error: {}", e.getMessage());
            cleanup.run();
        });

        log.debug("SSE connection opened");

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("{\"status\":\"connected\"}"));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE event: {}", e.getMessage());
        }

        return emitter;
    }

    /**
     * Broadcast a reminder event to all connected clients.
     */
    public void sendReminder(Reminder reminder) {
        if (emitters.isEmpty()) {
            log.debug("No SSE clients connected");
            return;
        }

        ReminderDto dto = ReminderDto.from(reminder);

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name("reminder")
                    .data(dto));
            } catch (IOException e) {
                log.debug("Failed to send SSE to client, removing: {}", e.getMessage());
                emitters.remove(emitter);
            }
        }
    }

    /**
     * Send a custom event to all connected clients.
     */
    public void sendEvent(String eventName, Object data) {
        if (emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(data));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }

    /**
     * Get count of connected clients.
     */
    public int getConnectionCount() {
        return emitters.size();
    }

    /**
     * Check if there are any connected clients.
     */
    public boolean hasConnections() {
        return !emitters.isEmpty();
    }
}
