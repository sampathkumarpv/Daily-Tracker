package com.taskflow.web.dto;

import java.util.List;

public record TaskResponse(
    Long id,
    String title,
    String tag,
    String status,
    String priority,
    String dueDate,
    String description,
    String area,
    List<SubtaskDto> subtasks,
    List<Long> notecardIds,
    String createdAt
) {}
