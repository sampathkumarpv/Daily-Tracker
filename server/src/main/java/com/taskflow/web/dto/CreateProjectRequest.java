package com.taskflow.web.dto;

public record CreateProjectRequest(
    String name,
    Long topicId,
    String description
) {}
