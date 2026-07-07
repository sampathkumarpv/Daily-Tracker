package com.taskflow.domain.repository;

import com.taskflow.domain.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findAllByOrderByPosition();
    List<Task> findAllByStatus(String status);
    List<Task> findAllByStatusOrderByPosition(String status);
}
