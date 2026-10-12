import api from './client';
import type { Task } from '../types';

export interface ApiTask {
  id: string;
  title: string;
  tag: string | null;
  status: string;
  priority: string | null;
  dueDate: string | null;
  description: string | null;
  topicId: string | null;
  projectId: string | null;
  subtasks: Array<{ id: string; text: string; done: boolean }>;
  notecardIds: string[];
  createdAt: string;
}

function toTask(t: ApiTask): Task {
  return {
    id: t.id,
    title: t.title,
    tag: t.tag ?? '',
    status: t.status as Task['status'],
    priority: (t.priority ?? undefined) as Task['priority'],
    dueDate: t.dueDate ?? undefined,
    description: t.description ?? undefined,
    // Ensure topicId and projectId are strings (backend may return numbers)
    topicId: t.topicId != null ? String(t.topicId) : undefined,
    projectId: t.projectId != null ? String(t.projectId) : undefined,
    subtasks: t.subtasks,
    notecardIds: t.notecardIds,
    createdAt: t.createdAt,
  };
}

export const tasksApi = {
  getAll: () => api.get<ApiTask[]>('/tasks').then(r => r.data.map(toTask)),
  create: (data: Omit<Task, 'id' | 'createdAt'>) => api.post<ApiTask>('/tasks', data).then(r => toTask(r.data)),
  update: (id: string, data: Partial<Task>) => api.put<ApiTask>(`/tasks/${id}`, data).then(r => toTask(r.data)),
  move: (id: string, status: string) => api.patch<ApiTask>(`/tasks/${id}/status`, { status }).then(r => toTask(r.data)),
  reorder: (status: string, orderedIds: string[]) => api.post('/tasks/reorder', { status, orderedIds }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addSubtask: (taskId: string, text: string) => api.post<ApiTask>(`/tasks/${taskId}/subtasks`, { text }).then(r => toTask(r.data)),
  toggleSubtask: (taskId: string, subtaskId: string) =>
    api.patch<ApiTask>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`).then(r => toTask(r.data)),
  attachNotecard: (taskId: string, notecardId: string) =>
    api.post<ApiTask>(`/tasks/${taskId}/notecards/${notecardId}`).then(r => toTask(r.data)),
  detachNotecard: (taskId: string, notecardId: string) =>
    api.delete(`/tasks/${taskId}/notecards/${notecardId}`),
};
