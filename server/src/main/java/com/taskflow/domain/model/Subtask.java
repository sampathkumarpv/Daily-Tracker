package com.taskflow.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "\"Subtask\"")
public class Subtask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"taskId\"", nullable = false)
    private Long taskId;

    private String text;
    private Boolean done;
    private Integer position;

    public Subtask() {
        this.done = false;
        this.position = 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Boolean getDone() { return done; }
    public void setDone(Boolean done) { this.done = done; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
