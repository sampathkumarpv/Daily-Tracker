import api from './client';

export interface ScratchpadResponse {
  date: string | null;
  content: string;
  updatedAt: number | null;
}

export const scratchpadApi = {
  /**
   * Get scratchpad for today
   */
  get: () => api.get<ScratchpadResponse>('/scratchpad').then(r => r.data),

  /**
   * Get scratchpad for a specific date (YYYY-MM-DD)
   */
  getByDate: (date: string) =>
    api.get<ScratchpadResponse>(`/scratchpad/${date}`).then(r => r.data),

  /**
   * Get scratchpads for a date range
   */
  getByDateRange: (from: string, to: string) =>
    api.get<ScratchpadResponse[]>('/scratchpad/range', { params: { from, to } }).then(r => r.data),

  /**
   * Save scratchpad for today
   */
  save: (content: string) =>
    api.put<ScratchpadResponse>('/scratchpad', { content }).then(r => r.data),

  /**
   * Save scratchpad for a specific date (YYYY-MM-DD)
   */
  saveForDate: (date: string, content: string) =>
    api.put<ScratchpadResponse>(`/scratchpad/${date}`, { content }).then(r => r.data),
};
