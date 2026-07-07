package com.taskflow.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "\"TaskNotecard\"")
public class TaskNotecard {

    @EmbeddedId
    private TaskNotecardId id;

    private Integer position;

    public TaskNotecard() {
        this.id = new TaskNotecardId();
        this.position = 0;
    }

    public TaskNotecard(TaskNotecardId id, Integer position) {
        this.id = id;
        this.position = position;
    }

    // Getters and Setters
    public TaskNotecardId getId() { return id; }
    public void setId(TaskNotecardId id) { this.id = id; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
