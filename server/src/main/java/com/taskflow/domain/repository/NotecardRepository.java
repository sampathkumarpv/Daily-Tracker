package com.taskflow.domain.repository;

import com.taskflow.domain.model.Notecard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotecardRepository extends JpaRepository<Notecard, Long> {
    List<Notecard> findAllByOrderByPosition();
    List<Notecard> findAllByNotebookIdOrderByPosition(Long notebookId);
}
