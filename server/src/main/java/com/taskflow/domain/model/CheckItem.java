package com.taskflow.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "\"CheckItem\"")
public class CheckItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"notecardId\"", nullable = false)
    private Long notecardId;

    private String text;
    private Boolean done;
    private Integer position;

    public CheckItem() {
        this.done = false;
        this.position = 0;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNotecardId() { return notecardId; }
    public void setNotecardId(Long notecardId) { this.notecardId = notecardId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Boolean getDone() { return done; }
    public void setDone(Boolean done) { this.done = done; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
