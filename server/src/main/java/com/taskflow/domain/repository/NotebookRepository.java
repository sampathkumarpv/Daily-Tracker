package com.taskflow.domain.repository;

import com.taskflow.domain.model.Notebook;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotebookRepository extends JpaRepository<Notebook, Long> {
    List<Notebook> findAllByOrderByPosition();
}
