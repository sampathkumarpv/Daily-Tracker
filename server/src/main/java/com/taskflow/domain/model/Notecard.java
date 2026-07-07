package com.taskflow.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "\"Notecard\"")
public class Notecard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"notebookId\"", nullable = false)
    private Long notebookId;

    private String title;
    private String content;
    private String body;  // TipTap/ProseMirror JSON document tree

    @Column(name = "\"codeBlock\"")
    private String codeBlock;

    private String reminder;
    private String tint;
    private Integer position;

    @Column(name = "\"createdAt\"", nullable = false)
    private Long createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private Long updatedAt;

    public Notecard() {
        this.title = "";
        this.content = "";
        this.tint = "#fdf2c7";
        this.position = 0;
        long now = System.currentTimeMillis();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getNotebookId() { return notebookId; }
    public void setNotebookId(Long notebookId) { this.notebookId = notebookId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getCodeBlock() { return codeBlock; }
    public void setCodeBlock(String codeBlock) { this.codeBlock = codeBlock; }

    public String getReminder() { return reminder; }
    public void setReminder(String reminder) { this.reminder = reminder; }

    public String getTint() { return tint; }
    public void setTint(String tint) { this.tint = tint; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
