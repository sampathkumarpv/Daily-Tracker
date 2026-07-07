/**
 * Scratchpad History API - localStorage-based persistence for date-based scratchpad entries
 * Enables calendar view to show scratchpad content for any given day
 * All timestamps stored in milliseconds
 */

import type { ScratchpadEntry } from '../types';

const STORAGE_KEY = 'tm_scratchpad_history';

/** Get YYYY-MM-DD string from Date (used as storage key) */
function formatDateKey(date: Date): string {
  // Use local date parts, NOT toISOString() which converts to UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Get YYYY-MM-DD string from milliseconds */
function formatDateKeyFromMillis(millis: number): string {
  return formatDateKey(new Date(millis));
}

/** Get start of day in milliseconds from a YYYY-MM-DD string */
function dateKeyToMillis(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function loadFromStorage(): Record<string, ScratchpadEntry> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch {
    return {};
  }
}

function saveToStorage(entries: Record<string, ScratchpadEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const scratchpadHistoryApi = {
  /**
   * Get scratchpad entry for a specific date (accepts millis or YYYY-MM-DD string)
   */
  getByDate(date: number | string): Promise<ScratchpadEntry | null> {
    const entries = loadFromStorage();
    const dateKey = typeof date === 'number' ? formatDateKeyFromMillis(date) : date;
    return Promise.resolve(entries[dateKey] || null);
  },

  /**
   * Get today's scratchpad entry
   */
  getToday(): Promise<ScratchpadEntry | null> {
    const today = formatDateKey(new Date());
    return this.getByDate(today);
  },

  /**
   * Get all scratchpad entries
   */
  getAll(): Promise<ScratchpadEntry[]> {
    const entries = loadFromStorage();
    return Promise.resolve(Object.values(entries));
  },

  /**
   * Get scratchpad entries for a date range (accepts millis or YYYY-MM-DD strings)
   */
  getByDateRange(from: number | string, to: number | string): Promise<ScratchpadEntry[]> {
    const entries = loadFromStorage();
    const fromMillis = typeof from === 'number' ? from : dateKeyToMillis(from);
    const toMillis = typeof to === 'number' ? to : dateKeyToMillis(to);

    const result: ScratchpadEntry[] = [];
    for (const [dateKey, entry] of Object.entries(entries)) {
      const entryMillis = dateKeyToMillis(dateKey);
      if (entryMillis >= fromMillis && entryMillis <= toMillis) {
        result.push(entry);
      }
    }

    return Promise.resolve(result.sort((a, b) => a.date - b.date));
  },

  /**
   * Save scratchpad content for today (or specified date)
   * @param content - The scratchpad content
   * @param date - Optional: millis or YYYY-MM-DD string (defaults to today)
   */
  save(content: string, date?: number | string): Promise<ScratchpadEntry> {
    const now = new Date();
    const dateKey = date
      ? (typeof date === 'number' ? formatDateKeyFromMillis(date) : date)
      : formatDateKey(now);
    const entries = loadFromStorage();

    const entry: ScratchpadEntry = {
      date: dateKeyToMillis(dateKey),
      content,
      updatedAt: Date.now(),
    };

    entries[dateKey] = entry;
    saveToStorage(entries);

    return Promise.resolve(entry);
  },

  /**
   * Check if there's content for a specific date (accepts millis or YYYY-MM-DD string)
   */
  hasContentForDate(date: number | string): Promise<boolean> {
    const entries = loadFromStorage();
    const dateKey = typeof date === 'number' ? formatDateKeyFromMillis(date) : date;
    const entry = entries[dateKey];
    return Promise.resolve(!!entry && entry.content.trim().length > 0);
  },

  /**
   * Get dates that have scratchpad content (for calendar dots)
   * Returns array of millisecond timestamps (start of each day)
   */
  getDatesWithContent(): Promise<number[]> {
    const entries = loadFromStorage();
    const dates = Object.entries(entries)
      .filter(([_, entry]) => entry.content.trim().length > 0)
      .map(([dateKey]) => dateKeyToMillis(dateKey));
    return Promise.resolve(dates);
  },

  /**
   * Clear all history (for testing)
   */
  clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  },
};
