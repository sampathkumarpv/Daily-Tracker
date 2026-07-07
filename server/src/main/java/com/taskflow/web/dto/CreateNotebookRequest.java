package com.taskflow.web.dto;

public record CreateNotebookRequest(
    String name,
    String color,
    String description
) {
    public CreateNotebookRequest {
        if (color == null) color = "#f0eee9";
    }
}
