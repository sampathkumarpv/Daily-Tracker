package com.taskflow.web.rest;

import com.taskflow.domain.model.Project;
import com.taskflow.service.ProjectService;
import com.taskflow.web.dto.CreateProjectRequest;
import com.taskflow.web.dto.UpdateProjectRequest;
import com.taskflow.web.dto.ProjectResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public List<ProjectResponse> getAll(@RequestParam(required = false) Long topicId,
                                         @RequestParam(required = false) String status) {
        List<Project> projects;
        if (topicId != null) {
            projects = projectService.findByTopicId(topicId);
        } else if (status != null) {
            projects = projectService.findByStatus(status);
        } else {
            projects = projectService.findAll();
        }
        return projects.stream()
                .map(ProjectResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ProjectResponse getById(@PathVariable Long id) {
        return ProjectResponse.from(projectService.findById(id));
    }

    @PostMapping
    public ProjectResponse create(@RequestBody CreateProjectRequest request) {
        Project project = projectService.create(
                request.name(),
                request.topicId(),
                request.description()
        );
        return ProjectResponse.from(project);
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@PathVariable Long id, @RequestBody UpdateProjectRequest request) {
        Project project = projectService.update(
                id,
                request.name(),
                request.topicId(),
                request.status(),
                request.description()
        );
        return ProjectResponse.from(project);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<Void> reorder(@RequestParam Long topicId, @RequestBody List<Long> orderedIds) {
        projectService.reorder(topicId, orderedIds);
        return ResponseEntity.ok().build();
    }
}
