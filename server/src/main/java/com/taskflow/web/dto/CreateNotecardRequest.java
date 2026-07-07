package com.taskflow.web.dto;

import java.util.List;

public record CreateNotecardRequest(
    Long notebookId,
    String title,
    String content,
    String body,  // TipTap JSON document
    String codeBlock,
    String reminder,
    String tint,
    List<CheckItemRequest> checkItems
) {
    public CreateNotecardRequest {
        if (title == null) title = "";
        if (content == null) content = "";
        if (tint == null) tint = "#fdf2c7";
        if (checkItems == null) checkItems = List.of();
    }
}
