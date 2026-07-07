package com.taskflow.web.rest;

import com.taskflow.service.NotecardService;
import com.taskflow.web.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notecards")
public class NotecardController {

    private final NotecardService service;

    public NotecardController(NotecardService service) {
        this.service = service;
    }

    @GetMapping
    public List<NotecardResponse> list() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public NotecardResponse get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NotecardResponse create(@RequestBody CreateNotecardRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public NotecardResponse update(@PathVariable Long id, @RequestBody UpdateNotecardRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PatchMapping("/{notecardId}/check-items/{itemId}/toggle")
    public NotecardResponse toggleCheckItem(@PathVariable Long notecardId, @PathVariable Long itemId) {
        return service.toggleCheckItem(notecardId, itemId);
    }
}
