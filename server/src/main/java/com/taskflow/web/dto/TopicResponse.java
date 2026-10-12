package com.taskflow.web.dto;

import com.taskflow.domain.model.Topic;

import java.time.Instant;

public record TopicResponse(
    String id,
    String name,
    String color,
    String description,
    Integer position,
    String createdAt
) {
    public static TopicResponse from(Topic topic) {
        return new TopicResponse(
            topic.getId().toString(),
            topic.getName(),
            topic.getColor(),
            topic.getDescription(),
            topic.getPosition(),
            Instant.ofEpochMilli(topic.getCreatedAt()).toString()
        );
    }
}
