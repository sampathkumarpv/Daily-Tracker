import api from './client';
import type { Topic } from '../types';

export interface ApiTopic {
  id: string;
  name: string;
  color: string;
  description: string | null;
  position: number;
  createdAt: string;
}

function toTopic(t: ApiTopic): Topic {
  return {
    id: String(t.id),  // Ensure ID is always a string
    name: t.name,
    color: t.color,
    description: t.description ?? undefined,
    position: t.position,
    createdAt: t.createdAt,
  };
}

export const topicsApi = {
  getAll: () => api.get<ApiTopic[]>('/topics').then(r => r.data.map(toTopic)),
  getById: (id: string) => api.get<ApiTopic>(`/topics/${id}`).then(r => toTopic(r.data)),
  create: (data: { name: string; color?: string; description?: string }) =>
    api.post<ApiTopic>('/topics', data).then(r => toTopic(r.data)),
  update: (id: string, data: { name?: string; color?: string; description?: string }) =>
    api.put<ApiTopic>(`/topics/${id}`, data).then(r => toTopic(r.data)),
  delete: (id: string) => api.delete(`/topics/${id}`),
  reorder: (orderedIds: string[]) => api.post('/topics/reorder', orderedIds.map(Number)),
};
