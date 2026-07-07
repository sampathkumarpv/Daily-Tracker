package com.taskflow.web.dto;

public record NotebookResponse(
    Long id,
    String name,
    String color,
    String description
) {}
