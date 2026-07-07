import api from './client';
import type { Notecard } from '../types';

export interface ApiNotecard {
  id: string;
  notebookId: string;
  notebookName: string;
  title: string;
  content: string;
  body: string | null;  // TipTap JSON document
  codeBlock: string | null;
  reminder: string | null;
  tint: string;
  checkItems: Array<{ id: string; text: string; done: boolean }>;
  attachments: string[];
  date: string;
}

function toNotecard(n: ApiNotecard): Notecard {
  const now = new Date().toISOString();
  // Use body from API if available, otherwise create fallback from plain content
  const body = n.body ?? JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: n.content ? [{ type: 'text', text: n.content }] : [] }]
  });
  return {
    id: n.id,
    notebookId: n.notebookId,
    notebookName: n.notebookName,
    title: n.title,
    body,
    createdAt: now,
    updatedAt: now,
    order: 0,
    attachedTaskIds: [],
    content: n.content,
    codeBlock: n.codeBlock ?? undefined,
    reminder: n.reminder ?? undefined,
    tint: n.tint,
    checkItems: n.checkItems,
    attachments: n.attachments,
    date: n.date,
  };
}

export const notecardsApi = {
  getAll: () => api.get<ApiNotecard[]>('/notecards').then(r => r.data.map(toNotecard)),
  getById: (id: string) => api.get<ApiNotecard>(`/notecards/${id}`).then(r => toNotecard(r.data)),
  create: (data: Omit<Notecard, 'id'>) => api.post<ApiNotecard>('/notecards', {
    notebookId: data.notebookId,
    title: data.title,
    content: data.content,
    body: data.body,
    codeBlock: data.codeBlock,
    reminder: data.reminder,
    tint: data.tint,
    checkItems: data.checkItems,
  }).then(r => toNotecard(r.data)),
  update: (id: string, data: Partial<Notecard>) => api.put<ApiNotecard>(`/notecards/${id}`, {
    title: data.title,
    content: data.content,
    body: data.body,
    codeBlock: data.codeBlock,
    reminder: data.reminder,
    tint: data.tint,
    checkItems: data.checkItems,
  }).then(r => toNotecard(r.data)),
  toggleCheckItem: (notecardId: string, itemId: string) =>
    api.patch<ApiNotecard>(`/notecards/${notecardId}/check-items/${itemId}/toggle`).then(r => toNotecard(r.data)),
  delete: (id: string) => api.delete(`/notecards/${id}`),
};
