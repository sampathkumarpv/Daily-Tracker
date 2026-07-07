package com.taskflow.web.dto;

public record CheckItemRequest(String text, boolean done) {
    public CheckItemRequest {
        if (text == null) text = "";
    }
    public CheckItemRequest(String text) {
        this(text, false);
    }
}
