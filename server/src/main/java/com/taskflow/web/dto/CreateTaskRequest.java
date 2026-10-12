package com.taskflow.web.dto;

import java.util.List;

public record CreateTaskRequest(
    String title,
    String tag,
    String status,
    String priority,
    String dueDate,
    String description,
    Long topicId,
    Long projectId,
    List<SubtaskRequest> subtasks
) {
    public CreateTaskRequest {
        if (status == null) status = "yts";
        if (subtasks == null) subtasks = List.of();
    }
}
