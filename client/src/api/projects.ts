import api from './client';
import type { Project, ProjectStatus } from '../types';

export interface ApiProject {
  id: string;
  name: string;
  topicId: string;
  status: string;
  description: string | null;
  position: number;
  createdAt: string;
}

function toProject(p: ApiProject): Project {
  return {
    id: String(p.id),  // Ensure ID is always a string
    name: p.name,
    topicId: String(p.topicId),  // Ensure topicId is always a string
    status: p.status as ProjectStatus,
    description: p.description ?? undefined,
    position: p.position,
    createdAt: p.createdAt,
  };
}

export const projectsApi = {
  getAll: (params?: { topicId?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.topicId) searchParams.set('topicId', params.topicId);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return api.get<ApiProject[]>(`/projects${query ? `?${query}` : ''}`).then(r => r.data.map(toProject));
  },
  getById: (id: string) => api.get<ApiProject>(`/projects/${id}`).then(r => toProject(r.data)),
  create: (data: { name: string; topicId: string; description?: string }) =>
    api.post<ApiProject>('/projects', { ...data, topicId: Number(data.topicId) }).then(r => toProject(r.data)),
  update: (id: string, data: { name?: string; topicId?: string; status?: ProjectStatus; description?: string }) =>
    api.put<ApiProject>(`/projects/${id}`, {
      ...data,
      topicId: data.topicId ? Number(data.topicId) : undefined,
    }).then(r => toProject(r.data)),
  delete: (id: string) => api.delete(`/projects/${id}`),
  reorder: (topicId: string, orderedIds: string[]) =>
    api.post(`/projects/reorder?topicId=${topicId}`, orderedIds.map(Number)),
};
