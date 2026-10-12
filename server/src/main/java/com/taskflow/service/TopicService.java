package com.taskflow.service;

import com.taskflow.domain.model.Topic;
import com.taskflow.domain.repository.TopicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TopicService {

    private final TopicRepository topicRepository;

    public TopicService(TopicRepository topicRepository) {
        this.topicRepository = topicRepository;
    }

    public List<Topic> findAll() {
        return topicRepository.findAllOrdered();
    }

    public Topic findById(Long id) {
        return topicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Topic not found: " + id));
    }

    public Topic create(String name, String color, String description) {
        Topic topic = new Topic();
        topic.setName(name);
        if (color != null) topic.setColor(color);
        if (description != null) topic.setDescription(description);

        // Set position to be at the end
        List<Topic> existing = topicRepository.findAllOrdered();
        topic.setPosition(existing.size());

        return topicRepository.save(topic);
    }

    public Topic update(Long id, String name, String color, String description) {
        Topic topic = findById(id);
        if (name != null) topic.setName(name);
        if (color != null) topic.setColor(color);
        if (description != null) topic.setDescription(description);
        return topicRepository.save(topic);
    }

    public void delete(Long id) {
        topicRepository.deleteById(id);
    }

    public void reorder(List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Topic topic = findById(orderedIds.get(i));
            topic.setPosition(i);
            topicRepository.save(topic);
        }
    }
}
