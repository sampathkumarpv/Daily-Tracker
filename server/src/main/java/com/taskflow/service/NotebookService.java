package com.taskflow.service;

import com.taskflow.domain.model.Notebook;
import com.taskflow.domain.repository.NotebookRepository;
import com.taskflow.web.dto.CreateNotebookRequest;
import com.taskflow.web.dto.NotebookResponse;
import com.taskflow.web.dto.UpdateNotebookRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class NotebookService {

    private final NotebookRepository notebookRepo;

    public NotebookService(NotebookRepository notebookRepo) {
        this.notebookRepo = notebookRepo;
    }

    public List<NotebookResponse> findAll() {
        return notebookRepo.findAllByOrderByPosition().stream()
                .map(this::toResponse)
                .toList();
    }

    public NotebookResponse findById(Long id) {
        Notebook notebook = notebookRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Notebook not found"));
        return toResponse(notebook);
    }

    public NotebookResponse create(CreateNotebookRequest req) {
        Notebook notebook = new Notebook();
        notebook.setName(req.name());
        notebook.setColor(req.color());
        notebook.setDescription(req.description());
        return toResponse(notebookRepo.save(notebook));
    }

    public NotebookResponse update(Long id, UpdateNotebookRequest req) {
        Notebook existing = notebookRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Notebook not found"));

        if (req.name() != null) existing.setName(req.name());
        if (req.color() != null) existing.setColor(req.color());
        if (req.description() != null) existing.setDescription(req.description());
        existing.setUpdatedAt(System.currentTimeMillis());

        return toResponse(notebookRepo.save(existing));
    }

    public void delete(Long id) {
        Notebook existing = notebookRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Notebook not found"));
        notebookRepo.delete(existing);
    }

    private NotebookResponse toResponse(Notebook notebook) {
        return new NotebookResponse(
            notebook.getId(),
            notebook.getName(),
            notebook.getColor(),
            notebook.getDescription()
        );
    }
}
