package com.taskflow.service;

import com.taskflow.domain.model.Project;
import com.taskflow.domain.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> findAll() {
        return projectRepository.findAllOrdered();
    }

    public List<Project> findByTopicId(Long topicId) {
        return projectRepository.findByTopicIdOrdered(topicId);
    }

    public List<Project> findByStatus(String status) {
        return projectRepository.findByStatusOrdered(status);
    }

    public Project findById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found: " + id));
    }

    public Project create(String name, Long topicId, String description) {
        Project project = new Project();
        project.setName(name);
        project.setTopicId(topicId);
        if (description != null) project.setDescription(description);

        // Set position to be at the end within the topic
        List<Project> existing = projectRepository.findByTopicIdOrdered(topicId);
        project.setPosition(existing.size());

        return projectRepository.save(project);
    }

    public Project update(Long id, String name, Long topicId, String status, String description) {
        Project project = findById(id);
        if (name != null) project.setName(name);
        if (topicId != null) project.setTopicId(topicId);
        if (status != null) project.setStatus(status);
        if (description != null) project.setDescription(description);
        return projectRepository.save(project);
    }

    public void delete(Long id) {
        projectRepository.deleteById(id);
    }

    public void reorder(Long topicId, List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Project project = findById(orderedIds.get(i));
            project.setPosition(i);
            projectRepository.save(project);
        }
    }
}
