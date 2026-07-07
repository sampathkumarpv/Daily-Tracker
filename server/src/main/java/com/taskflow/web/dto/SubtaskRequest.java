package com.taskflow.web.dto;

public record SubtaskRequest(String text, boolean done) {
    public SubtaskRequest {
        if (text == null) text = "";
    }
    public SubtaskRequest(String text) {
        this(text, false);
    }
}
