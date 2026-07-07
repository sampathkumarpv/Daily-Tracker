package com.taskflow.web.dto;

import java.util.List;

public record NotecardResponse(
    Long id,
    Long notebookId,
    String notebookName,
    String title,
    String content,
    String body,  // TipTap JSON document
    String codeBlock,
    String reminder,
    String tint,
    List<CheckItemDto> checkItems,
    List<String> attachments,
    String date
) {
    public NotecardResponse {
        if (attachments == null) attachments = List.of();
    }
}
