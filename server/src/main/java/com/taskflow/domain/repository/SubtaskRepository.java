package com.taskflow.domain.repository;

import com.taskflow.domain.model.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findAllByTaskIdOrderByPosition(Long taskId);
    void deleteAllByTaskId(Long taskId);
}
