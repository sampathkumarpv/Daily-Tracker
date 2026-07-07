package com.taskflow.web.rest;

import com.taskflow.service.TaskService;
import com.taskflow.web.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public List<TaskResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public TaskResponse get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(@RequestBody CreateTaskRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public TaskResponse update(@PathVariable Long id, @RequestBody UpdateTaskRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/status")
    public TaskResponse move(@PathVariable Long id, @RequestBody MoveTaskRequest req) {
        return service.move(id, req.status());
    }

    @PostMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@RequestBody ReorderTasksRequest req) {
        service.reorder(req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{taskId}/subtasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse addSubtask(@PathVariable Long taskId, @RequestBody Map<String, String> body) {
        return service.addSubtask(taskId, body.getOrDefault("text", ""));
    }

    @PatchMapping("/{taskId}/subtasks/{subtaskId}/toggle")
    public TaskResponse toggleSubtask(@PathVariable Long taskId, @PathVariable Long subtaskId) {
        return service.toggleSubtask(taskId, subtaskId);
    }

    @DeleteMapping("/{taskId}/subtasks/{subtaskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubtask(@PathVariable Long taskId, @PathVariable Long subtaskId) {
        service.deleteSubtask(taskId, subtaskId);
    }

    @PostMapping("/{taskId}/notecards/{notecardId}")
    public TaskResponse attachNotecard(@PathVariable Long taskId, @PathVariable Long notecardId) {
        return service.attachNotecard(taskId, notecardId);
    }

    @DeleteMapping("/{taskId}/notecards/{notecardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void detachNotecard(@PathVariable Long taskId, @PathVariable Long notecardId) {
        service.detachNotecard(taskId, notecardId);
    }
}
