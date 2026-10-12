package com.taskflow.web.dto;

public record UpdateTopicRequest(
    String name,
    String color,
    String description
) {}
