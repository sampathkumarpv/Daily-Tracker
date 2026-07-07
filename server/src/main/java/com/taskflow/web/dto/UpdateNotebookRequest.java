package com.taskflow.web.dto;

public record UpdateNotebookRequest(
    String name,
    String color,
    String description
) {}
