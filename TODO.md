# Project Manager - Development TODO

## ✅ Completed Features

### MVP Core
- [x] Database models (Project, Ticket) with SQLAlchemy 2.0
- [x] Flask app with basic CRUD routes
- [x] Alembic migrations setup
- [x] Main Kanban board UI (dark theme)
- [x] Drag-and-drop between columns (SortableJS)
- [x] Create/Edit ticket modal
- [x] Create/Edit project modal
- [x] Project filtering (multi-select checkboxes)

### Code Structure & Quality
- [x] Made GitHub URL optional (nullable in database)
- [x] Refactored dataclasses to `datamodels.py`
- [x] Renamed `models.py` to `database_orm.py`
- [x] Added comprehensive tests for `app.py` (17 tests)
- [x] Added comprehensive tests for `database_orm.py` (9 tests)

### UI Enhancements
- [x] "Create Project" button in navigation (next to "New Ticket")
- [x] Project-based ticket coloring (left border accent + colored dot in badge)
- [x] Multi-project selection filter (checkboxes, 0-n projects)
- [x] "Won't Do" section (grayed out, separate from main columns)
- [x] "Proposed" column (comes before "To Do")
- [x] Column visibility toggles (show/hide any column)
- [x] Settings panel with hamburger menu icon (3-line box)
- [x] Column visibility preferences saved to localStorage

---

## 🔜 Pending Features (Post-MVP)

### Settings Page
- [x] Default filter preferences (in settings panel)
- [x] Settings persistence to localStorage

### Advanced Filtering
- [x] Date range filter ("Show tickets from last X days")
- [x] Column visibility toggles (show/hide Proposed, To Do, In Progress, Done, Won't Do)
- [x] Filter state persistence in localStorage

### AI Integration Points
- [ ] AI generation button for `description` field
- [ ] AI generation button for `acceptance_criteria` field
- [ ] AI generation button for `scope` field
- [ ] AI generation button for `prompt` field
- [ ] Auto-generate all optional fields from title

### UI Enhancements
- [x] Search/filter by ticket title
- [x] Toast notifications for actions

### Future Considerations
- [ ] Ticket comments/history

---
