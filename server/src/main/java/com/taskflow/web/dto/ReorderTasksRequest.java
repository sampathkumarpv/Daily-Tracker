package com.taskflow.web.dto;

import java.util.List;

public record ReorderTasksRequest(String status, List<Long> orderedIds) {}
