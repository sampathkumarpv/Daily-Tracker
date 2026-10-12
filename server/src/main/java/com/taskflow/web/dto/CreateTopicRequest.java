package com.taskflow.web.dto;

public record CreateTopicRequest(
    String name,
    String color,
    String description
) {}
