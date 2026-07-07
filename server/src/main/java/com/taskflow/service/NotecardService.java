package com.taskflow.service;

import com.taskflow.domain.model.CheckItem;
import com.taskflow.domain.model.Notecard;
import com.taskflow.domain.repository.CheckItemRepository;
import com.taskflow.domain.repository.NotebookRepository;
import com.taskflow.domain.repository.NotecardRepository;
import com.taskflow.web.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class NotecardService {

    private final NotecardRepository notecardRepo;
    private final CheckItemRepository checkItemRepo;
    private final NotebookRepository notebookRepo;

    public NotecardService(NotecardRepository notecardRepo, CheckItemRepository checkItemRepo,
                           NotebookRepository notebookRepo) {
        this.notecardRepo = notecardRepo;
        this.checkItemRepo = checkItemRepo;
        this.notebookRepo = notebookRepo;
    }

    public List<NotecardResponse> findAll() {
        return notecardRepo.findAllByOrderByPosition().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<NotecardResponse> findByNotebook(Long notebookId) {
        return notecardRepo.findAllByNotebookIdOrderByPosition(notebookId).stream()
                .map(this::toResponse)
                .toList();
    }

    public NotecardResponse findById(Long id) {
        Notecard nc = notecardRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Notecard not found"));
        return toResponse(nc);
    }

    public NotecardResponse create(CreateNotecardRequest req) {
        notebookRepo.findById(req.notebookId()).orElseThrow(() -> new NoSuchElementException("Notebook not found"));

        Notecard nc = new Notecard();
        nc.setNotebookId(req.notebookId());
        nc.setTitle(req.title());
        nc.setContent(req.content());
        nc.setBody(req.body());
        nc.setCodeBlock(req.codeBlock());
        nc.setReminder(req.reminder());
        nc.setTint(req.tint());
        nc = notecardRepo.save(nc);

        final Long notecardId = nc.getId();
        List<CheckItem> items = new java.util.ArrayList<>();
        for (int i = 0; i < req.checkItems().size(); i++) {
            CheckItemRequest item = req.checkItems().get(i);
            CheckItem ci = new CheckItem();
            ci.setNotecardId(notecardId);
            ci.setText(item.text());
            ci.setDone(item.done());
            ci.setPosition(i);
            items.add(checkItemRepo.save(ci));
        }
        return toResponse(nc, items);
    }

    public NotecardResponse update(Long id, UpdateNotecardRequest req) {
        Notecard nc = notecardRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Notecard not found"));

        if (req.title() != null) nc.setTitle(req.title());
        if (req.content() != null) nc.setContent(req.content());
        if (req.body() != null) nc.setBody(req.body());
        if (req.codeBlock() != null) nc.setCodeBlock(req.codeBlock());
        if (req.reminder() != null) nc.setReminder(req.reminder());
        if (req.tint() != null) nc.setTint(req.tint());
        nc.setUpdatedAt(System.currentTimeMillis());
        nc = notecardRepo.save(nc);

        List<CheckItem> items;
        if (req.checkItems() != null) {
            checkItemRepo.deleteAllByNotecardId(id);
            items = new java.util.ArrayList<>();
            for (int i = 0; i < req.checkItems().size(); i++) {
                CheckItemRequest item = req.checkItems().get(i);
                CheckItem ci = new CheckItem();
                ci.setNotecardId(id);
                ci.setText(item.text());
                ci.setDone(item.done());
                ci.setPosition(i);
                items.add(checkItemRepo.save(ci));
            }
        } else {
            items = checkItemRepo.findAllByNotecardIdOrderByPosition(id);
        }

        return toResponse(nc, items);
    }

    public NotecardResponse toggleCheckItem(Long notecardId, Long itemId) {
        notecardRepo.findById(notecardId).orElseThrow(() -> new NoSuchElementException("Notecard not found"));
        CheckItem item = checkItemRepo.findById(itemId).orElseThrow(() -> new NoSuchElementException("CheckItem not found"));
        if (!item.getNotecardId().equals(notecardId)) {
            throw new IllegalArgumentException("CheckItem does not belong to notecard");
        }
        item.setDone(!item.getDone());
        checkItemRepo.save(item);
        return findById(notecardId);
    }

    public void delete(Long id) {
        Notecard nc = notecardRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Notecard not found"));
        checkItemRepo.deleteAllByNotecardId(id);
        notecardRepo.delete(nc);
    }

    private NotecardResponse toResponse(Notecard nc) {
        return toResponse(nc, null);
    }

    private NotecardResponse toResponse(Notecard nc, List<CheckItem> items) {
        List<CheckItem> checkItems = items != null ? items : checkItemRepo.findAllByNotecardIdOrderByPosition(nc.getId());
        var notebook = notebookRepo.findById(nc.getNotebookId()).orElse(null);

        String dateStr = Instant.ofEpochMilli(nc.getCreatedAt())
                .atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("MMM d"));

        return new NotecardResponse(
            nc.getId(),
            nc.getNotebookId(),
            notebook != null ? notebook.getName() : "",
            nc.getTitle(),
            nc.getContent(),
            nc.getBody(),
            nc.getCodeBlock(),
            nc.getReminder(),
            nc.getTint(),
            checkItems.stream().map(ci -> new CheckItemDto(ci.getId(), ci.getText(), ci.getDone())).toList(),
            List.of(),
            dateStr
        );
    }
}
