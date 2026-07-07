package com.taskflow.domain.model;

import jakarta.persistence.*;

@Entity
@Table(name = "\"Notebook\"")
public class Notebook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String color;
    private String description;
    private Integer position;

    @Column(name = "\"createdAt\"", nullable = false)
    private Long createdAt;

    @Column(name = "\"updatedAt\"", nullable = false)
    private Long updatedAt;

    public Notebook() {
        this.color = "#f0eee9";
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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public Long getCreatedAt() { return createdAt; }
    public void setCreatedAt(Long createdAt) { this.createdAt = createdAt; }

    public Long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Long updatedAt) { this.updatedAt = updatedAt; }
}
