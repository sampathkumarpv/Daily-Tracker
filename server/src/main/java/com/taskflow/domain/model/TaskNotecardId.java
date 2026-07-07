package com.taskflow.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TaskNotecardId implements Serializable {

    @Column(name = "\"taskId\"")
    private Long taskId;

    @Column(name = "\"notecardId\"")
    private Long notecardId;

    public TaskNotecardId() {}

    public TaskNotecardId(Long taskId, Long notecardId) {
        this.taskId = taskId;
        this.notecardId = notecardId;
    }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public Long getNotecardId() { return notecardId; }
    public void setNotecardId(Long notecardId) { this.notecardId = notecardId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TaskNotecardId that = (TaskNotecardId) o;
        return Objects.equals(taskId, that.taskId) && Objects.equals(notecardId, that.notecardId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(taskId, notecardId);
    }
}
