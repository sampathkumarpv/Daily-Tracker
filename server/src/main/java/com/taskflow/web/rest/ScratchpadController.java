package com.taskflow.web.rest;

import com.taskflow.domain.model.Scratchpad;
import com.taskflow.service.ScratchpadService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/scratchpad")
public class ScratchpadController {

    private final ScratchpadService service;

    public ScratchpadController(ScratchpadService service) {
        this.service = service;
    }

    /**
     * Get scratchpad for today (backward compatible)
     */
    @GetMapping
    public ScratchpadResponse get() {
        Scratchpad sp = service.get();
        return toResponse(sp);
    }

    /**
     * Get scratchpad for a specific date
     */
    @GetMapping("/{date}")
    public ScratchpadResponse getByDate(@PathVariable String date) {
        Scratchpad sp = service.getByDate(date);
        return toResponse(sp);
    }

    /**
     * Get scratchpads for a date range
     */
    @GetMapping("/range")
    public List<ScratchpadResponse> getByDateRange(
            @RequestParam String from,
            @RequestParam String to) {
        return service.getByDateRange(from, to).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Save scratchpad for today (backward compatible)
     */
    @PutMapping
    public ScratchpadResponse save(@RequestBody Map<String, String> body) {
        Scratchpad sp = service.save(body.getOrDefault("content", ""));
        return toResponse(sp);
    }

    /**
     * Save scratchpad for a specific date
     */
    @PutMapping("/{date}")
    public ScratchpadResponse saveForDate(
            @PathVariable String date,
            @RequestBody Map<String, String> body) {
        Scratchpad sp = service.saveForDate(date, body.getOrDefault("content", ""));
        return toResponse(sp);
    }

    private ScratchpadResponse toResponse(Scratchpad sp) {
        if (sp == null) {
            return new ScratchpadResponse(null, "", null);
        }
        return new ScratchpadResponse(sp.getDate(), sp.getContent(), sp.getUpdatedAt());
    }

    public record ScratchpadResponse(String date, String content, Long updatedAt) {}
}
