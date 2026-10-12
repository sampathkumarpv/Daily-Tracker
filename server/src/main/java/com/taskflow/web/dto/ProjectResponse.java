package com.taskflow.web.dto;

import com.taskflow.domain.model.Project;

import java.time.Instant;

public record ProjectResponse(
    String id,
    String name,
    String topicId,
    String status,
    String description,
    Integer position,
    String createdAt
) {
    public static ProjectResponse from(Project project) {
        return new ProjectResponse(
            project.getId().toString(),
            project.getName(),
            project.getTopicId().toString(),
            project.getStatus(),
            project.getDescription(),
            project.getPosition(),
            Instant.ofEpochMilli(project.getCreatedAt()).toString()
        );
    }
}
