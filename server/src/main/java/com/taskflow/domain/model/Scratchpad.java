package com.taskflow.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "\"Scratchpad\"")
public class Scratchpad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String date;  // YYYY-MM-DD format

    @Column(nullable = false)
    private String content = "";

    @Column(name = "\"updatedAt\"", nullable = false)
    private Long updatedAt;

    public Scratchpad() {
        this.content = "";
        this.updatedAt = System.currentTimeMillis();
    }

    public Scratchpad(String date, String content) {
        this.date = date;
        this.content = content;
        this.updatedAt = System.currentTimeMillis();
    }

    @PrePersist
    public void prePersist() {
        if (this.updatedAt == null) {
            this.updatedAt = System.currentTimeMillis();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
