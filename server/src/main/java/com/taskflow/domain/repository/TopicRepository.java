package com.taskflow.domain.repository;

import com.taskflow.domain.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {

    @Query("SELECT t FROM Topic t ORDER BY t.position ASC, t.createdAt ASC")
    List<Topic> findAllOrdered();
}
