import { useState, useCallback, useEffect } from 'react';
import type { Task, Notecard, Notebook, Reminder, View, Topic, Project } from '../types';
import type { Status, NotebookColor, ProjectStatus } from '../types';
import { tasksApi } from '../api/tasks';
import { notebooksApi } from '../api/notebooks';
import { notecardsApi } from '../api/notecards';
import { remindersApi, type CreateReminderRequest } from '../api/reminders';
import { topicsApi } from '../api/topics';
import { projectsApi } from '../api/projects';
import { activityLogApi } from '../api/activityLog';
import { reminderService } from '../services/reminderService';

const MAX_NOTECARDS_PER_TASK = 2;

export interface Store {
  tasks: Task[];
  notecards: Notecard[];
  notebooks: Notebook[];
  reminders: Reminder[];
  topics: Topic[];
  projects: Project[];
  activeView: View;

  // Topic/Project actions
  addTopic: (name: string, color?: string) => Promise<Topic>;
  updateTopic: (id: string, data: { name?: string; color?: string; description?: string }) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  addProject: (name: string, topicId: string) => Promise<Project>;
  updateProject: (id: string, data: { name?: string; status?: ProjectStatus; description?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectedTaskId: string | null;
  selectedNotecardId: string | null;
  selectedNotebookId: string | null;
  taskModalOpen: boolean;
  cardPickerOpen: boolean;
  loading: boolean;
  loadError: string | null;
  retryLoad: () => void;
  pendingRemindersCount: number;

  setView: (v: View, opts?: { notebookId?: string | null; notecardId?: string | null }) => void;

  // Task actions
  openTask: (id: string) => void;
  closeTask: () => void;
  moveTask: (taskId: string, status: Status) => void;
  reorderTasks: (status: Status, orderedIds: string[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (id: string) => void;

  // Card picker
  openCardPicker: () => void;
  closeCardPicker: () => void;

  // Notecard-Task attachment (with 2-card cap)
  attachCard: (taskId: string, notecardId: string) => { success: boolean; message?: string };
  detachCard: (taskId: string, notecardId: string) => void;

  // Notecard actions
  openNotecard: (id: string) => void;
  updateNotecard: (id: string, patch: Partial<Notecard>) => void;
  addNotecard: (card: Omit<Notecard, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  deleteNotecard: (id: string) => void;
  toggleCheckItem: (notecardId: string, itemId: string) => void;
  reorderNotecards: (notebookId: string, orderedIds: string[]) => void;
  moveNotecardToNotebook: (notecardId: string, notebookId: string) => void;

  // Notebook actions
  openNotebook: (id: string) => void;
  addNotebook: (notebook: Omit<Notebook, 'id' | 'createdAt' | 'order'>) => void;
  updateNotebook: (id: string, patch: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;
  reorderNotebooks: (orderedIds: string[]) => void;

  // Reminder actions
  addReminder: (request: CreateReminderRequest) => void;
  deleteReminder: (id: number) => void;

  // Toast callback for reminders
  onReminderFire: (callback: (reminder: Reminder) => void) => void;
}

export function useStore(): Store {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notecards, setNotecards] = useState<Notecard[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeView, setActiveViewState] = useState<View>(
    () => (localStorage.getItem('activeView') as View) ?? 'today'
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedNotecardId, setSelectedNotecardId] = useState<string | null>(
    () => localStorage.getItem('selectedNotecardId')
  );
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(
    () => localStorage.getItem('selectedNotebookId')
  );
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [cardPickerOpen, setCardPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadTick, setLoadTick] = useState(0);
  const [reminderCallback, setReminderCallback] = useState<((reminder: Reminder) => void) | null>(null);

  const retryLoad = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    setLoadTick(t => t + 1);
  }, []);

  // Calculate pending reminders count (unfired reminders due today)
  const pendingRemindersCount = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    return reminders.filter(r => {
      if (r.fired) return false;
      return r.dueAt >= today.getTime() && r.dueAt < tomorrow.getTime();
    }).length;
  })();

  // Load initial data
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      tasksApi.getAll(),
      notebooksApi.getAll(),
      notecardsApi.getAll(),
      remindersApi.getAll(),
      topicsApi.getAll(),
      projectsApi.getAll(),
    ])
      .then(([t, nb, nc, rem, top, proj]) => {
        if (cancelled) return;
        setTasks(t);
        setTopics(top);
        setProjects(proj);
        const processedNotebooks = nb.map((n, i) => ({
          ...n,
          createdAt: n.createdAt || new Date().toISOString(),
          order: n.order ?? i,
          color: (n.color || 'coral') as NotebookColor,
        }));
        setNotebooks(processedNotebooks);
        const processedNotecards = nc.map((c, i) => ({
          ...c,
          body: c.body || '',
          createdAt: c.createdAt || c.date || new Date().toISOString(),
          updatedAt: c.updatedAt || c.createdAt || c.date || new Date().toISOString(),
          order: c.order ?? i,
          attachedTaskIds: c.attachedTaskIds || [],
        }));
        setNotecards(processedNotecards);
        setReminders(rem);
        setLoadError(null);

        // Validate persisted selection after data loads
        const savedView = localStorage.getItem('activeView') as View;
        const savedNotebookId = localStorage.getItem('selectedNotebookId');
        const savedNotecardId = localStorage.getItem('selectedNotecardId');

        // Check if saved notebook/notecard still exist
        const notebookExists = savedNotebookId && processedNotebooks.some(n => n.id === savedNotebookId);
        const notecardExists = savedNotecardId && processedNotecards.some(c => c.id === savedNotecardId);

        // Reset to 'today' if the saved view requires a selection that no longer exists
        if (savedView === 'notebook-detail' && !notebookExists) {
          localStorage.setItem('activeView', 'today');
          localStorage.removeItem('selectedNotebookId');
          setActiveViewState('today');
          setSelectedNotebookId(null);
        } else if (savedView === 'notecard-editor' && (!notecardExists || !notebookExists)) {
          localStorage.setItem('activeView', 'today');
          localStorage.removeItem('selectedNotecardId');
          localStorage.removeItem('selectedNotebookId');
          setActiveViewState('today');
          setSelectedNotecardId(null);
          setSelectedNotebookId(null);
        }
      })
      .catch((error) => {
        console.error('Failed to load data', error);
        if (!cancelled) setLoadError('Could not reach the server. Make sure the backend is running.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [loadTick]);

  // Start reminder service
  useEffect(() => {
    reminderService.start();

    reminderService.setOnFireCallback((reminder) => {
      // Mark as fired in state
      setReminders(rs => rs.map(r => r.id === reminder.id ? { ...r, fired: true } : r));
      // Log activity
      activityLogApi.logReminderFired(reminder.label);
      // Trigger callback for toast
      if (reminderCallback) {
        reminderCallback(reminder);
      }
    });

    return () => {
      reminderService.stop();
    };
  }, [reminderCallback]);

  const setView = useCallback((v: View, opts?: { notebookId?: string | null; notecardId?: string | null }) => {
    localStorage.setItem('activeView', v);
    setActiveViewState(v);

    // Persist selected IDs based on view
    if (opts?.notebookId !== undefined) {
      if (opts.notebookId) {
        localStorage.setItem('selectedNotebookId', opts.notebookId);
      } else {
        localStorage.removeItem('selectedNotebookId');
      }
      setSelectedNotebookId(opts.notebookId);
    }
    if (opts?.notecardId !== undefined) {
      if (opts.notecardId) {
        localStorage.setItem('selectedNotecardId', opts.notecardId);
      } else {
        localStorage.removeItem('selectedNotecardId');
      }
      setSelectedNotecardId(opts.notecardId);
    }

    // Clear selection IDs when navigating away from detail views
    if (v !== 'notebook-detail' && v !== 'notecard-editor' && opts === undefined) {
      localStorage.removeItem('selectedNotebookId');
      localStorage.removeItem('selectedNotecardId');
      setSelectedNotebookId(null);
      setSelectedNotecardId(null);
    }
  }, []);

  // === Task Actions ===
  const openTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    setTaskModalOpen(true);
  }, []);

  const closeTask = useCallback(() => {
    setTaskModalOpen(false);
    setSelectedTaskId(null);
  }, []);

  const moveTask = useCallback((taskId: string, status: Status) => {
    const task = tasks.find(t => t.id === taskId);
    const oldStatus = task?.status;

    tasksApi.move(taskId, status).then(updated => {
      setTasks(ts => ts.map(t => (t.id === taskId ? updated : t)));

      // Log activity
      if (task && oldStatus && oldStatus !== status) {
        activityLogApi.logStatusChanged(taskId, task.tag, task.title, oldStatus, status);
      }
    });
  }, [tasks]);

  const reorderTasks = useCallback((status: Status, orderedIds: string[]) => {
    setTasks(ts => {
      const others = ts.filter(t => t.status !== status);
      const sorted = orderedIds.map(id => ts.find(t => t.id === id)).filter(Boolean) as Task[];
      return [...others, ...sorted];
    });
    tasksApi.reorder(status, orderedIds).catch((error) => {
      console.error('Failed to reorder tasks', error);
    });
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    tasksApi.create(task).then(created => {
      setTasks(ts => [...ts, created]);
      // Log activity
      activityLogApi.logTaskCreated(created.id, created.tag, created.title);
    });
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    const existingTask = tasks.find(task => task.id === id);
    if (patch.subtasks && existingTask && patch.subtasks.length > existingTask.subtasks.length) {
      const addedSubtask = patch.subtasks[patch.subtasks.length - 1];
      tasksApi.addSubtask(id, addedSubtask.text).then(updated =>
        setTasks(ts => ts.map(t => (t.id === id ? updated : t)))
      );
      return;
    }

    const taskPatch = { ...patch };
    delete taskPatch.subtasks;
    delete taskPatch.notecardIds;
    tasksApi.update(id, taskPatch).then(updated =>
      setTasks(ts => ts.map(t => (t.id === id ? updated : t)))
    );
  }, [tasks]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    tasksApi.toggleSubtask(taskId, subtaskId).then(updated =>
      setTasks(ts => ts.map(t => (t.id === taskId ? updated : t)))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    tasksApi.delete(id).then(() => setTasks(ts => ts.filter(t => t.id !== id)));
  }, []);

  // === Card Picker ===
  const openCardPicker = useCallback(() => setCardPickerOpen(true), []);
  const closeCardPicker = useCallback(() => setCardPickerOpen(false), []);

  // === Notecard-Task Attachment with 2-card cap ===
  const attachCard = useCallback((taskId: string, notecardId: string): { success: boolean; message?: string } => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found' };

    // Enforce 2-card cap
    if (task.notecardIds.length >= MAX_NOTECARDS_PER_TASK) {
      return {
        success: false,
        message: `A task can have at most ${MAX_NOTECARDS_PER_TASK} notecards attached. Detach one first.`
      };
    }

    // Check if already attached
    if (task.notecardIds.includes(notecardId)) {
      return { success: false, message: 'Notecard is already attached to this task' };
    }

    tasksApi.attachNotecard(taskId, notecardId).then(updated => {
      setTasks(ts => ts.map(t => (t.id === taskId ? updated : t)));
      // Also update notecard's attachedTaskIds
      setNotecards(ncs => ncs.map(nc =>
        nc.id === notecardId
          ? { ...nc, attachedTaskIds: [...(nc.attachedTaskIds || []), taskId] }
          : nc
      ));
      setCardPickerOpen(false);
    });

    return { success: true };
  }, [tasks]);

  const detachCard = useCallback((taskId: string, notecardId: string) => {
    tasksApi.detachNotecard(taskId, notecardId).then(() => {
      setTasks(ts => ts.map(t =>
        t.id === taskId ? { ...t, notecardIds: t.notecardIds.filter(id => id !== notecardId) } : t
      ));
      // Also update notecard's attachedTaskIds
      setNotecards(ncs => ncs.map(nc =>
        nc.id === notecardId
          ? { ...nc, attachedTaskIds: (nc.attachedTaskIds || []).filter(id => id !== taskId) }
          : nc
      ));
    });
  }, []);

  // === Notecard Actions ===
  const openNotecard = useCallback((id: string) => {
    const notecard = notecards.find(nc => nc.id === id);
    if (notecard) {
      setView('notecard-editor', { notecardId: id, notebookId: notecard.notebookId });
    }
  }, [notecards, setView]);

  const updateNotecard = useCallback((id: string, patch: Partial<Notecard>) => {
    const notecard = notecards.find(nc => nc.id === id);

    // Optimistic update
    setNotecards(ncs => ncs.map(nc => (nc.id === id ? { ...nc, ...patch, updatedAt: new Date().toISOString() } : nc)));

    notecardsApi.update(id, patch).then(() => {
      // Log activity for content updates (not just metadata changes)
      if (notecard && (patch.body || patch.title)) {
        activityLogApi.logNotecardUpdated(id, patch.title || notecard.title, notecard.notebookId, notecard.notebookName);
      }
    }).catch(error => {
      console.error('Failed to update notecard', error);
    });
  }, [notecards]);

  const addNotecard = useCallback((card: Omit<Notecard, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const notebookCards = notecards.filter(nc => nc.notebookId === card.notebookId);
    const maxOrder = notebookCards.length > 0 ? Math.max(...notebookCards.map(nc => nc.order ?? 0)) : -1;

    const newCard: Omit<Notecard, 'id'> = {
      ...card,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: maxOrder + 1,
    };

    notecardsApi.create(newCard as Omit<Notecard, 'id'>).then(created => {
      setNotecards(ncs => [...ncs, {
        ...created,
        body: created.body || '',
        createdAt: created.createdAt || new Date().toISOString(),
        updatedAt: created.updatedAt || new Date().toISOString(),
        order: created.order ?? notecards.length,
        attachedTaskIds: created.attachedTaskIds || [],
      }]);
      // Log activity
      activityLogApi.logNotecardCreated(created.id, created.title, created.notebookId, created.notebookName);
    });
  }, [notecards]);

  const deleteNotecard = useCallback((id: string) => {
    // Remove from any attached tasks first
    const notecard = notecards.find(nc => nc.id === id);
    if (notecard?.attachedTaskIds) {
      notecard.attachedTaskIds.forEach(taskId => {
        setTasks(ts => ts.map(t =>
          t.id === taskId ? { ...t, notecardIds: t.notecardIds.filter(ncId => ncId !== id) } : t
        ));
      });
    }

    // Delete associated reminders
    remindersApi.deleteByNotecardId(id);
    setReminders(rs => rs.filter(r => !(r.entityType === 'notecard' && r.entityId === id)));

    notecardsApi.delete(id).then(() => {
      setNotecards(ncs => ncs.filter(nc => nc.id !== id));
      // Navigate back to notebook detail if we're viewing this notecard
      if (selectedNotecardId === id) {
        setView('notebook-detail', { notecardId: null });
      }
    });
  }, [notecards, selectedNotecardId, setView]);

  const toggleCheckItem = useCallback((notecardId: string, itemId: string) => {
    notecardsApi.toggleCheckItem(notecardId, itemId).then(updated =>
      setNotecards(ncs => ncs.map(nc => (nc.id === notecardId ? {
        ...updated,
        body: updated.body || nc.body,
        createdAt: updated.createdAt || nc.createdAt,
        updatedAt: updated.updatedAt || new Date().toISOString(),
        order: updated.order ?? nc.order,
        attachedTaskIds: updated.attachedTaskIds || nc.attachedTaskIds,
      } : nc)))
    );
  }, []);

  const reorderNotecards = useCallback((notebookId: string, orderedIds: string[]) => {
    setNotecards(ncs => {
      const others = ncs.filter(nc => nc.notebookId !== notebookId);
      const reordered = orderedIds.map((id, i) => {
        const card = ncs.find(nc => nc.id === id);
        return card ? { ...card, order: i } : null;
      }).filter(Boolean) as Notecard[];
      return [...others, ...reordered];
    });
    // TODO: Persist to backend when API supports it
  }, []);

  const moveNotecardToNotebook = useCallback((notecardId: string, notebookId: string) => {
    const notebook = notebooks.find(nb => nb.id === notebookId);
    if (!notebook) return;

    setNotecards(ncs => ncs.map(nc =>
      nc.id === notecardId
        ? { ...nc, notebookId, notebookName: notebook.name }
        : nc
    ));
    // TODO: Persist to backend when API supports it
  }, [notebooks]);

  // === Notebook Actions ===
  const openNotebook = useCallback((id: string) => {
    setView('notebook-detail', { notebookId: id, notecardId: null });
  }, [setView]);

  const addNotebook = useCallback((notebook: Omit<Notebook, 'id' | 'createdAt' | 'order'>) => {
    const maxOrder = notebooks.length > 0 ? Math.max(...notebooks.map(nb => nb.order ?? 0)) : -1;
    const newOrder = maxOrder + 1;
    const newCreatedAt = new Date().toISOString();

    // Optimistic update — add immediately so the UI responds
    const tempId = `temp-${Date.now()}`;
    const optimistic: Notebook = {
      id: tempId,
      name: notebook.name,
      color: notebook.color as NotebookColor,
      description: notebook.description,
      createdAt: newCreatedAt,
      order: newOrder,
    };
    setNotebooks(nbs => [...nbs, optimistic]);

    notebooksApi.create({
      name: notebook.name,
      color: notebook.color as NotebookColor,
      description: notebook.description,
      createdAt: newCreatedAt,
      order: newOrder,
    }).then(created => {
      // Replace temp entry with server-confirmed one
      setNotebooks(nbs => nbs.map(nb => nb.id === tempId ? {
        ...created,
        createdAt: created.createdAt || newCreatedAt,
        order: created.order ?? newOrder,
        color: (created.color || notebook.color) as NotebookColor,
      } : nb));
      activityLogApi.logNotebookCreated(created.id, created.name);
    }).catch(err => {
      console.error('Failed to create notebook', err);
      // Roll back optimistic update
      setNotebooks(nbs => nbs.filter(nb => nb.id !== tempId));
    });
  }, [notebooks]);

  const updateNotebook = useCallback((id: string, patch: Partial<Notebook>) => {
    setNotebooks(nbs => nbs.map(nb => (nb.id === id ? { ...nb, ...patch } : nb)));

    notebooksApi.update(id, patch).catch(error => {
      console.error('Failed to update notebook', error);
    });
  }, []);

  const deleteNotebook = useCallback((id: string) => {
    // Also delete all notecards in this notebook
    const cardsToDelete = notecards.filter(nc => nc.notebookId === id);
    cardsToDelete.forEach(card => {
      // Remove from attached tasks
      if (card.attachedTaskIds) {
        card.attachedTaskIds.forEach(taskId => {
          setTasks(ts => ts.map(t =>
            t.id === taskId ? { ...t, notecardIds: t.notecardIds.filter(ncId => ncId !== card.id) } : t
          ));
        });
      }
      // Delete associated reminders
      remindersApi.deleteByNotecardId(card.id);
    });

    setNotecards(ncs => ncs.filter(nc => nc.notebookId !== id));
    setReminders(rs => rs.filter(r => !(r.entityType === 'notecard' && cardsToDelete.some(c => c.id === r.entityId))));

    notebooksApi.delete(id).then(() => {
      setNotebooks(nbs => nbs.filter(nb => nb.id !== id));
      if (selectedNotebookId === id) {
        setView('notebooks', { notebookId: null, notecardId: null });
      }
    });
  }, [notecards, selectedNotebookId, setView]);

  const reorderNotebooks = useCallback((orderedIds: string[]) => {
    setNotebooks(nbs => {
      return orderedIds.map((id, i) => {
        const nb = nbs.find(n => n.id === id);
        return nb ? { ...nb, order: i } : null;
      }).filter(Boolean) as Notebook[];
    });
    // TODO: Persist to backend when API supports it
  }, []);

  // === Reminder Actions ===
  const addReminder = useCallback((request: CreateReminderRequest) => {
    remindersApi.create(request).then(created => {
      setReminders(rs => [...rs, created]);
    });
  }, []);

  const deleteReminder = useCallback((id: number) => {
    remindersApi.delete(id).then(() => {
      setReminders(rs => rs.filter(r => r.id !== id));
    });
  }, []);

  const onReminderFire = useCallback((callback: (reminder: Reminder) => void) => {
    setReminderCallback(() => callback);
  }, []);

  // === Topic/Project Actions ===
  const addTopic = useCallback(async (name: string, color?: string): Promise<Topic> => {
    const created = await topicsApi.create({ name, color });
    setTopics(ts => [...ts, created]);
    return created;
  }, []);

  const updateTopic = useCallback(async (id: string, data: { name?: string; color?: string; description?: string }): Promise<void> => {
    const updated = await topicsApi.update(id, data);
    setTopics(ts => ts.map(t => t.id === id ? updated : t));
  }, []);

  const deleteTopic = useCallback(async (id: string): Promise<void> => {
    await topicsApi.delete(id);
    setTopics(ts => ts.filter(t => t.id !== id));
    // Also remove projects under this topic
    setProjects(ps => ps.filter(p => p.topicId !== id));
    // Unassign tasks from this topic
    setTasks(ts => ts.map(t => t.topicId === id ? { ...t, topicId: undefined, projectId: undefined } : t));
  }, []);

  const addProject = useCallback(async (name: string, topicId: string): Promise<Project> => {
    const created = await projectsApi.create({ name, topicId });
    setProjects(ps => [...ps, created]);
    return created;
  }, []);

  const updateProject = useCallback(async (id: string, data: { name?: string; status?: ProjectStatus; description?: string }): Promise<void> => {
    const updated = await projectsApi.update(id, data);
    setProjects(ps => ps.map(p => p.id === id ? updated : p));
  }, []);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    await projectsApi.delete(id);
    setProjects(ps => ps.filter(p => p.id !== id));
    // Unassign tasks from this project
    setTasks(ts => ts.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
  }, []);

  return {
    tasks, notecards, notebooks, reminders, topics, projects,
    activeView, selectedTaskId, selectedNotecardId, selectedNotebookId,
    taskModalOpen, cardPickerOpen, loading, loadError, retryLoad, pendingRemindersCount,
    setView,
    openTask, closeTask,
    moveTask, reorderTasks, addTask, updateTask, toggleSubtask, deleteTask,
    openCardPicker, closeCardPicker, attachCard, detachCard,
    openNotecard, updateNotecard, addNotecard, deleteNotecard, toggleCheckItem,
    reorderNotecards, moveNotecardToNotebook,
    openNotebook, addNotebook, updateNotebook, deleteNotebook, reorderNotebooks,
    addReminder, deleteReminder, onReminderFire,
    addTopic, updateTopic, deleteTopic, addProject, updateProject, deleteProject,
  };
}
