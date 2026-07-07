package com.taskflow.web.rest;

import com.taskflow.service.NotebookService;
import com.taskflow.service.NotecardService;
import com.taskflow.web.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notebooks")
public class NotebookController {

    private final NotebookService service;
    private final NotecardService notecardService;

    public NotebookController(NotebookService service, NotecardService notecardService) {
        this.service = service;
        this.notecardService = notecardService;
    }

    @GetMapping
    public List<NotebookResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public NotebookResponse get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NotebookResponse create(@RequestBody CreateNotebookRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public NotebookResponse update(@PathVariable Long id, @RequestBody UpdateNotebookRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/{id}/notecards")
    public List<NotecardResponse> notecards(@PathVariable Long id) {
        return notecardService.findByNotebook(id);
    }
}
