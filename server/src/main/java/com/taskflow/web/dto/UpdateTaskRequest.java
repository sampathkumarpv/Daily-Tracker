package com.taskflow.web.dto;

public record UpdateTaskRequest(
    String title,
    String tag,
    String status,
    String priority,
    String dueDate,
    String description,
    String area
) {}
