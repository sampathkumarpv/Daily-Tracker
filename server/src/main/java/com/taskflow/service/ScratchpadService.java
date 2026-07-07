package com.taskflow.service;

import com.taskflow.domain.model.Scratchpad;
import com.taskflow.domain.repository.ScratchpadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class ScratchpadService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ScratchpadRepository repo;

    public ScratchpadService(ScratchpadRepository repo) {
        this.repo = repo;
    }

    private String today() {
        return LocalDate.now().format(DATE_FORMAT);
    }

    /**
     * Get scratchpad for today (backward compatible)
     */
    public Scratchpad get() {
        return getByDate(today());
    }

    /**
     * Get scratchpad for a specific date
     */
    public Scratchpad getByDate(String date) {
        return repo.findByDate(date).orElse(null);
    }

    /**
     * Get scratchpads for a date range
     */
    public List<Scratchpad> getByDateRange(String startDate, String endDate) {
        return repo.findByDateBetweenOrderByDateDesc(startDate, endDate);
    }

    /**
     * Save scratchpad for today (backward compatible)
     */
    public Scratchpad save(String content) {
        return saveForDate(today(), content);
    }

    /**
     * Save scratchpad for a specific date
     */
    public Scratchpad saveForDate(String date, String content) {
        Scratchpad scratchpad = repo.findByDate(date).orElse(null);
        if (scratchpad != null) {
            scratchpad.setContent(content);
        } else {
            scratchpad = new Scratchpad(date, content);
        }
        return repo.save(scratchpad);
    }
}
