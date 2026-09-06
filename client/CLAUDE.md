# Client Code Rules

## General Coding Principles

- **Loosely coupled code**: Write reusable, modular code. Components should have minimal dependencies on each other.
- **No hardcoding**: Avoid hardcoding values unless absolutely necessary. Use constants, configuration, or props instead.
- **Proper naming**: Use clear, descriptive names for variables, functions, and files that convey intent.
- **Comments**: Add comments where logic isn't self-evident. Document the "why", not the "what".

---

## Data Handling

- **Browser caching**: Only cache data in browser storage (localStorage/sessionStorage) when necessary. Prefer server as source of truth.
- **Pagination**: Handle pagination for large datasets. Never load unbounded data lists.

---

## Date Handling

- **Store dates in YYYY-MM-DD format** for date-only fields (e.g., `dueDate`)
- **Calculate display labels dynamically** using `src/utils/dateUtils.ts`
- Available utilities:
  - `getDueDateLabel(date)` - Returns "Today", "Tomorrow", "Overdue", or "Jul 15"
  - `isDueToday(date)` - Check if date is today
  - `isOverdue(date)` - Check if date is past
  - `isDueTodayOrOverdue(date)` - Check if urgent (for styling)

---

## Theme Rules - ALWAYS FOLLOW

### Colors - Always use `C.xxx`, never hardcode hex/rgb values

```tsx
✅ color: C.ink
✅ background: C.paper
❌ color: '#2a2620'
❌ background: 'rgb(255,255,255)'
```

### Fonts - Always use `FONTS.xxx`, never hardcode font names

```tsx
✅ fontFamily: FONTS.head
✅ fontFamily: FONTS.body
❌ fontFamily: "'Caveat', cursive"
❌ fontFamily: 'Arial'
```

### Font Sizes - Always use `rem` units, never `px`

```tsx
✅ fontSize: '1rem'      // 16px at scale 1
✅ fontSize: '0.75rem'   // 12px at scale 1
✅ fontSize: rem(14)     // helper function
❌ fontSize: 16
❌ fontSize: '12px'
```

Common conversions (px ÷ 16 = rem):
- 10px = 0.625rem | 14px = 0.875rem | 20px = 1.25rem
- 12px = 0.75rem  | 16px = 1rem     | 24px = 1.5rem
- 13px = 0.8125rem | 18px = 1.125rem | 28px = 1.75rem

### Icons - Always import from centralized registry

```tsx
✅ import { IconBell, IconPlus } from '../ui/Icons';
❌ import { Bell } from 'lucide-react';  // Don't import directly!
```

Registry location: `src/components/ui/Icons.tsx`

To add a new icon:
1. Add it to `src/components/ui/Icons.tsx`
2. Use naming convention: `IconXxx` (e.g., IconTrash, IconEdit)
3. Import from Icons.tsx in your component

### Container Naming - Every container should have a name attribute

```tsx
✅ <div name="task-card">...</div>
✅ <section name="sidebar-nav">...</section>
❌ <div>...</div>  // Anonymous - hard to debug!
```

Naming convention:
- Use kebab-case: `task-card`, `sidebar-nav`, `modal-overlay`
- Match component name: TaskCard → `name="task-card"`

### Color Semantics

- `C.coral` / `C.coralSoft` - Urgent/warning states (overdue, high priority, in-process)
- `C.teal` / `C.tealSoft` - Success/done states
- `C.yellow` / `C.yellowSoft` - Review/pending states
- `C.lilac` / `C.lilacSoft` - Investigation states
- `C.pencil` / `C.pencilLight` - Secondary/muted text
- `C.ink` / `C.inkSoft` - Primary text
- `C.paper` / `C.paperDark` - Backgrounds
