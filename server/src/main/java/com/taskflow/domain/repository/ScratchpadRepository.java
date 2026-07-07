package com.taskflow.domain.repository;

import com.taskflow.domain.model.Scratchpad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScratchpadRepository extends JpaRepository<Scratchpad, Long> {
    Optional<Scratchpad> findByDate(String date);
    List<Scratchpad> findByDateBetweenOrderByDateDesc(String startDate, String endDate);
}
