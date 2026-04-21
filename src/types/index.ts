export type Status = 'yts' | 'proc' | 'rev' | 'inv' | 'done';

export type Priority = 'hi' | 'med' | 'lo';

export interface Notecard {
  id: string;
  title: string;
  notebookId: string;
  notebookName: string;
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
  isSubtaskOf?: string;    // parent task id
  area?: string;
}

export interface Notebook {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export type View = 'today' | 'board' | 'all' | 'done' | 'notebooks' | 'notebook-detail' | 'notecard-editor';

export interface AppState {
  tasks: Task[];
  notecards: Notecard[];
  notebooks: Notebook[];
  activeView: View;
  selectedTaskId: string | null;
  selectedNotecardId: string | null;
  selectedNotebookId: string | null;
  taskModalOpen: boolean;
  cardPickerOpen: boolean;
}
