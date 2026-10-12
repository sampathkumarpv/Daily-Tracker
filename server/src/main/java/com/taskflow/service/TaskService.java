package com.taskflow.service;

import com.taskflow.domain.model.Subtask;
import com.taskflow.domain.model.Task;
import com.taskflow.domain.model.TaskNotecard;
import com.taskflow.domain.model.TaskNotecardId;
import com.taskflow.domain.repository.NotecardRepository;
import com.taskflow.domain.repository.SubtaskRepository;
import com.taskflow.domain.repository.TaskNotecardRepository;
import com.taskflow.domain.repository.TaskRepository;
import com.taskflow.web.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepo;
    private final SubtaskRepository subtaskRepo;
    private final TaskNotecardRepository taskNotecardRepo;
    private final NotecardRepository notecardRepo;

    public TaskService(TaskRepository taskRepo, SubtaskRepository subtaskRepo,
                       TaskNotecardRepository taskNotecardRepo, NotecardRepository notecardRepo) {
        this.taskRepo = taskRepo;
        this.subtaskRepo = subtaskRepo;
        this.taskNotecardRepo = taskNotecardRepo;
        this.notecardRepo = notecardRepo;
    }

    public List<TaskResponse> findAll() {
        return taskRepo.findAllByOrderByPosition().stream()
                .map(this::toResponse)
                .toList();
    }

    public TaskResponse findById(Long id) {
        Task task = taskRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Task not found"));
        return toResponse(task);
    }

    public TaskResponse create(CreateTaskRequest req) {
        Task task = new Task();
        task.setTitle(req.title());
        task.setTag(req.tag());
        task.setStatus(req.status());
        task.setPriority(req.priority());
        task.setDueDate(req.dueDate());
        task.setDescription(req.description());
        task.setTopicId(req.topicId());
        task.setProjectId(req.projectId());
        task = taskRepo.save(task);

        final Long taskId = task.getId();
        List<Subtask> subtasks = new java.util.ArrayList<>();
        for (int i = 0; i < req.subtasks().size(); i++) {
            SubtaskRequest st = req.subtasks().get(i);
            Subtask subtask = new Subtask();
            subtask.setTaskId(taskId);
            subtask.setText(st.text());
            subtask.setDone(st.done());
            subtask.setPosition(i);
            subtasks.add(subtaskRepo.save(subtask));
        }
        return toResponse(task, subtasks);
    }

    public TaskResponse update(Long id, UpdateTaskRequest req) {
        Task task = taskRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Task not found"));

        if (req.title() != null) task.setTitle(req.title());
        if (req.tag() != null) task.setTag(req.tag());
        if (req.status() != null) task.setStatus(req.status());
        if (req.priority() != null) task.setPriority(req.priority());
        if (req.dueDate() != null) task.setDueDate(req.dueDate());
        if (req.description() != null) task.setDescription(req.description());
        if (req.topicId() != null) task.setTopicId(req.topicId());
        if (req.projectId() != null) task.setProjectId(req.projectId());
        task.setUpdatedAt(System.currentTimeMillis());

        return toResponse(taskRepo.save(task));
    }

    public TaskResponse move(Long id, String status) {
        Task task = taskRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Task not found"));
        task.setStatus(status);
        task.setUpdatedAt(System.currentTimeMillis());
        return toResponse(taskRepo.save(task));
    }

    public void reorder(ReorderTasksRequest req) {
        for (int i = 0; i < req.orderedIds().size(); i++) {
            Long taskId = req.orderedIds().get(i);
            final int position = i;
            taskRepo.findById(taskId).ifPresent(task -> {
                task.setPosition(position);
                task.setUpdatedAt(System.currentTimeMillis());
                taskRepo.save(task);
            });
        }
    }

    public void delete(Long id) {
        Task task = taskRepo.findById(id).orElseThrow(() -> new NoSuchElementException("Task not found"));
        subtaskRepo.deleteAllByTaskId(id);
        taskRepo.delete(task);
    }

    public TaskResponse addSubtask(Long taskId, String text) {
        Task task = taskRepo.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found"));
        List<Subtask> existing = subtaskRepo.findAllByTaskIdOrderByPosition(taskId);
        Subtask subtask = new Subtask();
        subtask.setTaskId(taskId);
        subtask.setText(text);
        subtask.setPosition(existing.size());
        subtaskRepo.save(subtask);
        return toResponse(task);
    }

    public TaskResponse toggleSubtask(Long taskId, Long subtaskId) {
        Task task = taskRepo.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found"));
        Subtask subtask = subtaskRepo.findById(subtaskId).orElseThrow(() -> new NoSuchElementException("Subtask not found"));
        if (!subtask.getTaskId().equals(taskId)) {
            throw new IllegalArgumentException("Subtask does not belong to task");
        }
        subtask.setDone(!subtask.getDone());
        subtaskRepo.save(subtask);
        return toResponse(task);
    }

    public TaskResponse deleteSubtask(Long taskId, Long subtaskId) {
        Task task = taskRepo.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found"));
        Subtask subtask = subtaskRepo.findById(subtaskId).orElseThrow(() -> new NoSuchElementException("Subtask not found"));
        if (!subtask.getTaskId().equals(taskId)) {
            throw new IllegalArgumentException("Subtask does not belong to task");
        }
        subtaskRepo.delete(subtask);
        return toResponse(task);
    }

    public TaskResponse attachNotecard(Long taskId, Long notecardId) {
        Task task = taskRepo.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found"));
        notecardRepo.findById(notecardId).orElseThrow(() -> new NoSuchElementException("Notecard not found"));

        long count = taskNotecardRepo.countByIdTaskId(taskId);
        boolean exists = taskNotecardRepo.findById(new TaskNotecardId(taskId, notecardId)).isPresent();
        if (count >= 2 && !exists) {
            throw new IllegalArgumentException("Max 2 notecards per task");
        }

        TaskNotecard tn = new TaskNotecard(new TaskNotecardId(taskId, notecardId), (int) count);
        taskNotecardRepo.save(tn);
        return toResponse(task);
    }

    public TaskResponse detachNotecard(Long taskId, Long notecardId) {
        Task task = taskRepo.findById(taskId).orElseThrow(() -> new NoSuchElementException("Task not found"));
        taskNotecardRepo.deleteByIdTaskIdAndIdNotecardId(taskId, notecardId);
        return toResponse(task);
    }

    private TaskResponse toResponse(Task task) {
        return toResponse(task, null);
    }

    private TaskResponse toResponse(Task task, List<Subtask> subtasks) {
        List<Subtask> subs = subtasks != null ? subtasks : subtaskRepo.findAllByTaskIdOrderByPosition(task.getId());
        List<TaskNotecard> notecardLinks = taskNotecardRepo.findAllByIdTaskId(task.getId());

        String dateStr = Instant.ofEpochMilli(task.getCreatedAt())
                .atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("MMM d"));

        return new TaskResponse(
            task.getId(),
            task.getTitle(),
            task.getTag(),
            task.getStatus(),
            task.getPriority(),
            task.getDueDate(),
            task.getDescription(),
            task.getTopicId(),
            task.getProjectId(),
            subs.stream().map(s -> new SubtaskDto(s.getId(), s.getText(), s.getDone())).toList(),
            notecardLinks.stream()
                .sorted(Comparator.comparingInt(TaskNotecard::getPosition))
                .map(tn -> tn.getId().getNotecardId())
                .toList(),
            dateStr
        );
    }
}
