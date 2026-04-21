import { useState, useCallback } from 'react';
import type { Task, Notecard, Notebook, View } from '../types';
import type { Status } from '../types';
import { TASKS, NOTECARDS, NOTEBOOKS } from '../data/seed';

export interface Store {
  tasks: Task[];
  notecards: Notecard[];
  notebooks: Notebook[];
  activeView: View;
  selectedTaskId: string | null;
  selectedNotecardId: string | null;
  selectedNotebookId: string | null;
  taskModalOpen: boolean;
  cardPickerOpen: boolean;

  // navigation
  setView: (v: View) => void;

  // tasks
  openTask: (id: string) => void;
  closeTask: () => void;
  moveTask: (taskId: string, status: Status) => void;
  reorderTasks: (status: Status, orderedIds: string[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // notecards
  openCardPicker: () => void;
  closeCardPicker: () => void;
  attachCard: (taskId: string, notecardId: string) => void;
  detachCard: (taskId: string, notecardId: string) => void;
  openNotecard: (id: string) => void;
  updateNotecard: (id: string, patch: Partial<Notecard>) => void;
  addNotecard: (card: Omit<Notecard, 'id'>) => void;
  toggleCheckItem: (notecardId: string, itemId: string) => void;

  // notebooks
  openNotebook: (id: string) => void;
}

let _nextId = 100;
const uid = () => `id_${_nextId++}`;

export function useStore(): Store {
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [notecards, setNotecards] = useState<Notecard[]>(NOTECARDS);
  const [notebooks] = useState<Notebook[]>(NOTEBOOKS);
  const [activeView, setActiveView] = useState<View>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedNotecardId, setSelectedNotecardId] = useState<string | null>(null);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [cardPickerOpen, setCardPickerOpen] = useState(false);

  const setView = useCallback((v: View) => setActiveView(v), []);

  const openTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    setTaskModalOpen(true);
  }, []);

  const closeTask = useCallback(() => {
    setTaskModalOpen(false);
    setSelectedTaskId(null);
  }, []);

  const moveTask = useCallback((taskId: string, status: Status) => {
    setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, status } : t)));
  }, []);

  const reorderTasks = useCallback((status: Status, orderedIds: string[]) => {
    setTasks((ts) => {
      const others = ts.filter((t) => t.status !== status);
      const sorted = orderedIds
        .map((id) => ts.find((t) => t.id === id))
        .filter(Boolean) as Task[];
      return [...others, ...sorted];
    });
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks((ts) => [...ts, { ...task, id: uid(), createdAt: 'Today' }]);
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done: !s.done } : s
              ),
            }
          : t
      )
    );
  }, []);

  const openCardPicker = useCallback(() => setCardPickerOpen(true), []);
  const closeCardPicker = useCallback(() => setCardPickerOpen(false), []);

  const attachCard = useCallback((taskId: string, notecardId: string) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId && t.notecardIds.length < 2 && !t.notecardIds.includes(notecardId)
          ? { ...t, notecardIds: [...t.notecardIds, notecardId] }
          : t
      )
    );
    setCardPickerOpen(false);
  }, []);

  const detachCard = useCallback((taskId: string, notecardId: string) => {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId ? { ...t, notecardIds: t.notecardIds.filter((id) => id !== notecardId) } : t
      )
    );
  }, []);

  const openNotecard = useCallback((id: string) => {
    setSelectedNotecardId(id);
    setActiveView('notecard-editor');
  }, []);

  const updateNotecard = useCallback((id: string, patch: Partial<Notecard>) => {
    setNotecards((ncs) => ncs.map((nc) => (nc.id === id ? { ...nc, ...patch } : nc)));
  }, []);

  const addNotecard = useCallback((card: Omit<Notecard, 'id'>) => {
    const id = uid();
    setNotecards((ncs) => [...ncs, { ...card, id }]);
    return id;
  }, []);

  const toggleCheckItem = useCallback((notecardId: string, itemId: string) => {
    setNotecards((ncs) =>
      ncs.map((nc) =>
        nc.id === notecardId
          ? {
              ...nc,
              checkItems: nc.checkItems.map((ci) =>
                ci.id === itemId ? { ...ci, done: !ci.done } : ci
              ),
            }
          : nc
      )
    );
  }, []);

  const openNotebook = useCallback((id: string) => {
    setSelectedNotebookId(id);
    setActiveView('notebook-detail');
  }, []);

  return {
    tasks,
    notecards,
    notebooks,
    activeView,
    selectedTaskId,
    selectedNotecardId,
    selectedNotebookId,
    taskModalOpen,
    cardPickerOpen,
    setView,
    openTask,
    closeTask,
    moveTask,
    reorderTasks,
    addTask,
    updateTask,
    toggleSubtask,
    openCardPicker,
    closeCardPicker,
    attachCard,
    detachCard,
    openNotecard,
    updateNotecard,
    addNotecard,
    toggleCheckItem,
    openNotebook,
  };
}
