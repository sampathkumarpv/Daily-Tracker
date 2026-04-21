import { C, FONTS } from './theme';
import { useStore } from './hooks/useStore';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { AllTasksView } from './components/kanban/AllTasksView';
import { TodayView } from './components/today/TodayView';
import { NotebookShelf } from './components/notebook/NotebookShelf';
import { NotebookDetail } from './components/notebook/NotebookDetail';
import { NotecardEditor } from './components/notebook/NotecardEditor';
import { TaskModal } from './components/modal/TaskModal';
import { CardPickerModal } from './components/modal/CardPickerModal';
import type { Status } from './types';

export default function App() {
  const store = useStore();

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
      case 'notebooks': return 'Notebooks';
      case 'notebook-detail': return selectedNotebook?.name ?? 'Notebook';
      case 'notecard-editor': return selectedNotecard
        ? `${selectedNotecard.notebookName} · ${selectedNotecard.title}`
        : 'Note';
      default: return 'My Tasks';
    }
  };

  const renderMain = () => {
    switch (store.activeView) {
      case 'today':
        return <TodayView tasks={store.tasks} onTaskClick={store.openTask} />;

      case 'board':
        return (
          <KanbanBoard
            tasks={store.tasks}
            onTaskClick={store.openTask}
            onMoveTask={store.moveTask}
            onReorderTasks={store.reorderTasks}
            onAddTask={store.addTask}
          />
        );

      case 'all':
        return <AllTasksView tasks={store.tasks} onTaskClick={store.openTask} filterStatus="all" />;

      case 'done':
        return <AllTasksView tasks={store.tasks} onTaskClick={store.openTask} filterStatus="done" />;

      case 'notebooks':
        return (
          <NotebookShelf
            notebooks={store.notebooks}
            notecards={store.notecards}
            onOpenNotebook={store.openNotebook}
          />
        );

      case 'notebook-detail':
        if (!selectedNotebook) return null;
        return (
          <NotebookDetail
            notebook={selectedNotebook}
            notecards={store.notecards}
            onOpenNotecard={store.openNotecard}
            onBack={() => store.setView('notebooks')}
          />
        );

      case 'notecard-editor':
        if (!selectedNotecard) return null;
        return (
          <NotecardEditor
            notecard={selectedNotecard}
            allNotecards={store.notecards}
            onBack={() => store.setView('notebook-detail')}
            onUpdate={(patch) => store.updateNotecard(selectedNotecard.id, patch)}
            onToggleCheckItem={(itemId) => store.toggleCheckItem(selectedNotecard.id, itemId)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: C.paper,
        fontFamily: FONTS.kalam,
        color: C.ink,
        overflow: 'hidden',
      }}
    >
      <TopBar title={topBarTitle()} tasks={store.tasks} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <Sidebar
          activeView={store.activeView}
          onNavigate={store.setView}
          onOpenNotebook={store.openNotebook}
          notebooks={store.notebooks}
          taskCounts={taskCounts}
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
        />
      )}

      {store.cardPickerOpen && selectedTask && (
        <CardPickerModal
          task={selectedTask}
          notecards={store.notecards}
          onAttach={(ncId) => store.attachCard(selectedTask.id, ncId)}
          onClose={store.closeCardPicker}
        />
      )}
    </div>
  );
}
