/**
 * Date utilities for due date handling
 * Stores dates in YYYY-MM-DD format, calculates display labels dynamically
 */

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return formatDateToString(new Date());
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date object (at midnight local time)
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/**
 * Calculate display label for a due date
 * Returns: "Overdue", "Today", "Tomorrow", or formatted date like "Jul 15"
 */
export function getDueDateLabel(dueDate: string | null | undefined): string | null {
  if (!dueDate) return null;

  const date = parseDateString(dueDate);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Overdue';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Check if a due date is today
 */
export function isDueToday(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const label = getDueDateLabel(dueDate);
  return label === 'Today';
}

/**
 * Check if a due date is overdue
 */
export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const label = getDueDateLabel(dueDate);
  return label === 'Overdue';
}

/**
 * Check if a due date is today or overdue (for highlighting)
 */
export function isDueTodayOrOverdue(dueDate: string | null | undefined): boolean {
  return isDueToday(dueDate) || isOverdue(dueDate);
}
