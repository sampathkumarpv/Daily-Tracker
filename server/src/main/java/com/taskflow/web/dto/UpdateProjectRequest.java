package com.taskflow.web.dto;

public record UpdateProjectRequest(
    String name,
    Long topicId,
    String status,
    String description
) {}
