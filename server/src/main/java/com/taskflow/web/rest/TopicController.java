package com.taskflow.web.rest;

import com.taskflow.domain.model.Topic;
import com.taskflow.service.TopicService;
import com.taskflow.web.dto.CreateTopicRequest;
import com.taskflow.web.dto.UpdateTopicRequest;
import com.taskflow.web.dto.TopicResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/topics")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping
    public List<TopicResponse> getAll() {
        return topicService.findAll().stream()
                .map(TopicResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public TopicResponse getById(@PathVariable Long id) {
        return TopicResponse.from(topicService.findById(id));
    }

    @PostMapping
    public TopicResponse create(@RequestBody CreateTopicRequest request) {
        Topic topic = topicService.create(
                request.name(),
                request.color(),
                request.description()
        );
        return TopicResponse.from(topic);
    }

    @PutMapping("/{id}")
    public TopicResponse update(@PathVariable Long id, @RequestBody UpdateTopicRequest request) {
        Topic topic = topicService.update(
                id,
                request.name(),
                request.color(),
                request.description()
        );
        return TopicResponse.from(topic);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        topicService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<Void> reorder(@RequestBody List<Long> orderedIds) {
        topicService.reorder(orderedIds);
        return ResponseEntity.ok().build();
    }
}
