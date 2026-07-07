package com.taskflow.domain.repository;

import com.taskflow.domain.model.TaskNotecard;
import com.taskflow.domain.model.TaskNotecardId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskNotecardRepository extends JpaRepository<TaskNotecard, TaskNotecardId> {
    List<TaskNotecard> findAllByIdTaskId(Long taskId);
    long countByIdTaskId(Long taskId);
    void deleteByIdTaskIdAndIdNotecardId(Long taskId, Long notecardId);
}
