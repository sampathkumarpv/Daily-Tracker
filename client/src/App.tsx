import { useEffect, useState, useCallback } from 'react';
import { C, FONTS } from './theme';
import { useStore } from './hooks/useStore';
import { useToasts, ToastContainer } from './components/ui/Toast';
import { ThemePanel } from './components/ui/ThemePanel';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { AllTasksView } from './components/kanban/AllTasksView';
import { TodayView } from './components/today/TodayView';
import { CalendarView } from './components/calendar/CalendarView';
import { NotebookShelf } from './components/notebook/NotebookShelf';
import { NotebookDetail } from './components/notebook/NotebookDetail';
import { NotecardEditor } from './components/notebook/NotecardEditor';
import { TaskModal } from './components/modal/TaskModal';
import { CardPickerModal } from './components/modal/CardPickerModal';
import type { Status } from './types';

// Parse URL for calendar params
function getCalendarParamsFromUrl(): { date?: string; from?: string; to?: string } {
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);

  // /calendar/:date pattern
  const dateMatch = path.match(/^\/calendar\/(\d{4}-\d{2}-\d{2})$/);
  if (dateMatch) {
    return { date: dateMatch[1] };
  }

  // /calendar?from=...&to=... pattern
  if (path === '/calendar' || path === '/calendar/') {
    const from = search.get('from');
    const to = search.get('to');
    if (from && to) {
      return { from, to };
    }
  }

  return {};
}

export default function App() {
  const store = useStore();
  const { toasts, dismissToast, showReminder } = useToasts();
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  // Calendar URL state
  const [calendarParams, setCalendarParams] = useState(getCalendarParamsFromUrl);

  // Handle URL changes for calendar
  const handleCalendarUrlChange = useCallback((params: { date?: string; from?: string; to?: string }) => {
    let newPath = '/calendar';
    let newSearch = '';

    if (params.date) {
      newPath = `/calendar/${params.date}`;
    } else if (params.from && params.to) {
      newSearch = `?from=${params.from}&to=${params.to}`;
    }

    const newUrl = newPath + newSearch;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.pushState({}, '', newUrl);
    }
    setCalendarParams(params);
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const params = getCalendarParamsFromUrl();
      setCalendarParams(params);

      // If we're on /calendar path, switch to calendar view
      if (window.location.pathname.startsWith('/calendar')) {
        store.setView('calendar');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [store.setView]);

  // Check initial URL for calendar route
  useEffect(() => {
    if (window.location.pathname.startsWith('/calendar')) {
      store.setView('calendar');
    }
  }, []);

  // Subscribe to reminder notifications
  useEffect(() => {
    store.onReminderFire((reminder) => {
      showReminder(reminder.label);
    });
  }, [store.onReminderFire, showReminder]);

  const selectedTask = store.tasks.find((t) => t.id === store.selectedTaskId) ?? null;
  const selectedNotecard = store.notecards.find((nc) => nc.id === store.selectedNotecardId) ?? null;
  const selectedNotebook = store.notebooks.find((nb) => nb.id === store.selectedNotebookId) ?? null;

  const taskCounts: Record<string, number> = {
    today: store.tasks.filter((t) => t.dueDate === 'Today' || t.status === 'proc').length,
    board: store.tasks.filter((t) => t.status !== 'done').length,
    all: store.tasks.length,
    done: store.tasks.filter((t) => t.status === 'done').length,
  };

  const topBarTitle = () => {
    switch (store.activeView) {
      case 'today': return 'Today';
      case 'calendar': return 'Calendar';
      case 'notebooks': return 'Notebooks';
      case 'notebook-detail': return selectedNotebook?.name ?? 'Notebook';
      case 'notecard-editor': return selectedNotecard
        ? `${selectedNotecard.notebookName} · ${selectedNotecard.title}`
        : 'Note';
      default: return 'My Tasks';
    }
  };

  // Navigate to calendar
  const handleCalendarClick = useCallback(() => {
    store.setView('calendar');
    // Update URL to /calendar with today's date (use local date, not UTC)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    window.history.pushState({}, '', `/calendar/${today}`);
    setCalendarParams({ date: today });
  }, [store.setView]);

  // Navigate from calendar back to today
  const handleNavigateToToday = useCallback(() => {
    store.setView('today');
    window.history.pushState({}, '', '/');
  }, [store.setView]);

  // Navigate to a task on the board with focus highlight
  const handleNavigateToTask = useCallback((taskId: string) => {
    store.setView('board');
    setFocusedTaskId(taskId);
  }, [store.setView]);

  // Clear focus when clicking anywhere
  const handleClearFocus = useCallback(() => {
    if (focusedTaskId) {
      setFocusedTaskId(null);
    }
  }, [focusedTaskId]);

  const renderMain = () => {
    switch (store.activeView) {
      case 'today':
        return <TodayView tasks={store.tasks} onTaskClick={store.openTask} onOpenCalendar={handleCalendarClick} />;

      case 'calendar':
        return (
          <CalendarView
            onNavigateToToday={handleNavigateToToday}
            initialDate={calendarParams.date}
            initialFrom={calendarParams.from}
            initialTo={calendarParams.to}
            onUrlChange={handleCalendarUrlChange}
          />
        );

      case 'board':
        return (
          <KanbanBoard
            tasks={store.tasks}
            onTaskClick={store.openTask}
            onMoveTask={store.moveTask}
            onReorderTasks={store.reorderTasks}
            onAddTask={store.addTask}
            focusedTaskId={focusedTaskId}
            onClearFocus={handleClearFocus}
          />
        );

      case 'all':
        return <AllTasksView tasks={store.tasks} onTaskClick={store.openTask} onAddTask={store.addTask} onDeleteTask={store.deleteTask} filterStatus="all" />;

      case 'done':
        return <AllTasksView tasks={store.tasks} onTaskClick={store.openTask} onDeleteTask={store.deleteTask} filterStatus="done" />;

      case 'notebooks':
        return (
          <NotebookShelf
            notebooks={store.notebooks}
            notecards={store.notecards}
            onOpenNotebook={store.openNotebook}
            onAddNotebook={store.addNotebook}
            onUpdateNotebook={store.updateNotebook}
            onDeleteNotebook={store.deleteNotebook}
            onReorderNotebooks={store.reorderNotebooks}
            onMoveNotecardToNotebook={store.moveNotecardToNotebook}
          />
        );

      case 'notebook-detail':
        if (!selectedNotebook) return null;
        return (
          <NotebookDetail
            notebook={selectedNotebook}
            notebooks={store.notebooks}
            notecards={store.notecards}
            onOpenNotecard={store.openNotecard}
            onBack={() => store.setView('notebooks')}
            onAddNotecard={store.addNotecard}
            onUpdateNotecard={store.updateNotecard}
            onDeleteNotecard={store.deleteNotecard}
            onReorderNotecards={store.reorderNotecards}
            onMoveNotecardToNotebook={store.moveNotecardToNotebook}
            onUpdateNotebook={store.updateNotebook}
          />
        );

      case 'notecard-editor':
        if (!selectedNotecard || !selectedNotebook) return null;
        return (
          <NotecardEditor
            notecard={selectedNotecard}
            notebook={selectedNotebook}
            allNotecards={store.notecards}
            tasks={store.tasks}
            reminders={store.reminders}
            onBack={() => store.setView('notebook-detail')}
            onUpdate={(patch) => store.updateNotecard(selectedNotecard.id, patch)}
            onOpenNotecard={store.openNotecard}
            onAddReminder={store.addReminder}
            onDeleteReminder={store.deleteReminder}
            onDeleteNotecard={store.deleteNotecard}
            onNavigateToTask={handleNavigateToTask}
          />
        );

      default:
        return null;
    }
  };

  // Show full-screen loading/error state before app is ready
  if (store.loading || store.loadError) {
    return (
      <LoadingScreen
        appName="TaskFlow"
        error={store.loadError}
        onRetry={store.loadError ? store.retryLoad : undefined}
      />
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: C.paper,
        fontFamily: FONTS.ui,
        color: C.ink,
        overflow: 'hidden',
      }}
    >
      <ThemePanel isOpen={themePanelOpen} onClose={() => setThemePanelOpen(false)} />
      <TopBar
        title={topBarTitle()}
        tasks={store.tasks}
        notecards={store.notecards}
        onThemeToggle={() => setThemePanelOpen(!themePanelOpen)}
        themeOpen={themePanelOpen}
        onCalendarClick={handleCalendarClick}
        isCalendarActive={store.activeView === 'calendar'}
        onTaskClick={store.openTask}
        onNotecardClick={store.openNotecard}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <Sidebar
          activeView={store.activeView}
          onNavigate={store.setView}
          onOpenNotebook={store.openNotebook}
          notebooks={store.notebooks}
          taskCounts={taskCounts}
          pendingRemindersCount={store.pendingRemindersCount}
        />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {renderMain()}
        </main>
      </div>

      {store.taskModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          notecards={store.notecards}
          onClose={store.closeTask}
          onOpenCardPicker={store.openCardPicker}
          onDetachCard={(ncId) => store.detachCard(selectedTask.id, ncId)}
          onOpenNotecard={(id) => { store.closeTask(); store.openNotecard(id); }}
          onToggleSubtask={(stId) => store.toggleSubtask(selectedTask.id, stId)}
          onMoveTask={(status: Status) => store.moveTask(selectedTask.id, status)}
          onAddSubtask={(text) => {
            const sub = { id: `st_${Date.now()}`, text, done: false };
            store.updateTask(selectedTask.id, { subtasks: [...selectedTask.subtasks, sub] });
          }}
          onUpdateTask={(patch) => store.updateTask(selectedTask.id, patch)}
        />
      )}

      {store.cardPickerOpen && selectedTask && (
        <CardPickerModal
          task={selectedTask}
          notecards={store.notecards}
          notebooks={store.notebooks}
          onAttach={(ncId) => store.attachCard(selectedTask.id, ncId)}
          onCreateNotecard={(notebookId) => {
            // Navigate to notebook and create new notecard
            const notebook = store.notebooks.find(nb => nb.id === notebookId);
            if (notebook) {
              store.addNotecard({
                title: `Note for "${selectedTask.title}"`,
                notebookId,
                notebookName: notebook.name,
                body: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
                attachedTaskIds: [selectedTask.id],
                date: new Date().toLocaleDateString(),
                content: '',
                checkItems: [],
                attachments: [],
                tint: `var(--color-${notebook.color}Soft)`,
              });
            }
          }}
          onClose={store.closeCardPicker}
        />
      )}

      {/* Toast notifications for reminders */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
