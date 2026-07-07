package com.taskflow.web.dto;

import java.util.List;

public record UpdateNotecardRequest(
    String title,
    String content,
    String body,  // TipTap JSON document
    String codeBlock,
    String reminder,
    String tint,
    List<CheckItemRequest> checkItems
) {}
