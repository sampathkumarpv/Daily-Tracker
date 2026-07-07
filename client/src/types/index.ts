export type Status = 'yts' | 'proc' | 'rev' | 'inv' | 'done';

export type Priority = 'hi' | 'med' | 'lo';

// Notebook accent colors — stored as hex or legacy theme key
export type NotebookColor = string;

// Rich text block types for notecard body
export type BlockType =
  | 'paragraph'
  | 'bulletList'
  | 'taskList'
  | 'codeBlock'
  | 'dateChip'
  | 'reminderChip'
  | 'attachment'
  | 'image';

export interface Reminder {
  id: number;
  entityType: string;    // 'task', 'notecard', 'notebook', etc.
  entityId: string;
  label: string;
  dueAt: number;         // milliseconds since epoch
  fired: boolean;
  firedAt?: number;      // milliseconds when fired
  repeatRule?: string;   // 'daily', 'weekly', 'monthly'
  createdAt: number;
  updatedAt: number;
}

// Alias for backward compatibility
export type ReminderEntityType = 'task' | 'notecard' | 'notebook';

export interface Notecard {
  id: string;
  title: string;
  notebookId: string;
  notebookName: string;
  body: string;  // TipTap JSON content (rich blocks)
  createdAt: string;
  updatedAt: string;
  order: number;
  attachedTaskIds: string[];
  // Legacy fields for backward compatibility
  date: string;
  content: string;
  checkItems: CheckItem[];
  codeBlock?: string;
  reminder?: string;
  attachments: string[];
  tint: string;
}

export interface CheckItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  tag: string;
  status: Status;
  priority?: Priority;
  dueDate?: string;
  description?: string;
  subtasks: Subtask[];
  notecardIds: string[];   // max 2
  createdAt: string;
  updatedAt?: string;      // ISO datetime - last modification
  isSubtaskOf?: string;    // parent task id
  area?: string;
}

export interface Notebook {
  id: string;
  name: string;
  color: NotebookColor;
  description?: string;
  createdAt: string;
  updatedAt?: string;      // ISO datetime - last modification
  order: number;
}

// Scratchpad entry with date tracking (timestamps in milliseconds)
export interface ScratchpadEntry {
  date: number;            // Time in milliseconds (start of day)
  content: string;
  updatedAt: number;       // Time in milliseconds
}

export type View = 'today' | 'board' | 'all' | 'done' | 'notebooks' | 'notebook-detail' | 'notecard-editor' | 'calendar';

// Calendar Activity Event types
export type ActivityEventType =
  | 'created'           // Task created
  | 'status_changed'    // Task status changed (not to done)
  | 'completed'         // Task completed (status changed to done)
  | 'notecard_created'  // Notecard created
  | 'notecard_updated'  // Notecard content updated
  | 'notebook_created'  // Notebook created
  | 'scratchpad_updated' // Scratchpad content saved
  | 'reminder_fired';   // Reminder triggered

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  taskId?: string;
  taskTag?: string;
  title: string;
  from?: Status;        // for status_changed
  to?: Status;          // for status_changed
  notebookId?: string;  // for notecard_created
  notebookName?: string; // for notecard_created
  notecardId?: string;  // for notecard_created
  timestamp: number;    // Time in milliseconds
}

// Calendar view mode
export type CalendarMode = 'day' | 'timeframe';

// Calendar include filters
export interface CalendarFilters {
  newTasks: boolean;
  statusUpdates: boolean;
  completed: boolean;
  notecards: boolean;
  reminders: boolean;
}

export interface AppState {
  tasks: Task[];
  notecards: Notecard[];
  notebooks: Notebook[];
  reminders: Reminder[];
  activeView: View;
  selectedTaskId: string | null;
  selectedNotecardId: string | null;
  selectedNotebookId: string | null;
  taskModalOpen: boolean;
  cardPickerOpen: boolean;
}
