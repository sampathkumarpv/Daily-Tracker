package com.taskflow.domain.repository;

import com.taskflow.domain.model.CheckItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CheckItemRepository extends JpaRepository<CheckItem, Long> {
    List<CheckItem> findAllByNotecardIdOrderByPosition(Long notecardId);
    void deleteAllByNotecardId(Long notecardId);
}
