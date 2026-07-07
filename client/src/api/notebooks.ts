import api from './client';
import type { Notebook } from '../types';

export const notebooksApi = {
  getAll: () => api.get<Notebook[]>('/notebooks').then(r => r.data),
  create: (data: Omit<Notebook, 'id'>) => api.post<Notebook>('/notebooks', data).then(r => r.data),
  update: (id: string, data: Partial<Notebook>) => api.put<Notebook>(`/notebooks/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/notebooks/${id}`),
};
