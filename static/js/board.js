const STATUS_LABELS = {
    proposed: 'Proposed',
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    wont_do: "Won't Do",
};

const STATUS_COLORS = {
    proposed: '#bf5af2',
    todo: '#ffd60a',
    in_progress: '#0a84ff',
    done: '#30d158',
    wont_do: '#6b7280',
};

const TOAST_ICON_PATHS = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

let _ticketModalPrevFocus = null;
let _projectModalPrevFocus = null;
let _settingsPrevFocus = null;
let _ticketsPopoutAnchor = null;
let _projectTicketsData = null;

document.addEventListener('DOMContentLoaded', () => {
    const bgVideo = document.getElementById('bgVideo');
    if (bgVideo) bgVideo.playbackRate = 0.5;

    initializeSortable();
    loadColumnVisibility();
    loadDefaultFilterPreferences();
    sortTickets();

    const hideDeprecatedToggle = document.getElementById('toggle-hide-deprecated');
    if (hideDeprecatedToggle) hideDeprecatedToggle.checked = loadHideDeprecatedSetting();
    applyHideDeprecatedToProjects();

    const searchInput = document.getElementById('projectSearch');
    const dropdown = document.getElementById('projectFilterDropdown');
    if (searchInput) {
        searchInput.addEventListener('focus', () => dropdown.classList.remove('hidden'));
    }
});

document.addEventListener('click', (event) => {
    const searchInput = document.getElementById('projectSearch');
    const dropdown = document.getElementById('projectFilterDropdown');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput && dropdown && clearBtn &&
        !searchInput.contains(event.target) &&
        !dropdown.contains(event.target) &&
        !clearBtn.contains(event.target)) {
        dropdown.classList.add('hidden');
    }

    const popout = document.getElementById('projectTicketsPopout');
    if (popout && !popout.classList.contains('hidden') &&
        !popout.contains(event.target) &&
        !event.target.closest('.project-tickets-trigger')) {
        closeProjectTicketsPopout();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeProjectTicketsPopout();
        closeTicketModal();
        closeProjectModal();
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel && settingsPanel.classList.contains('open')) {
            toggleSettingsPanel();
        }
    }
});

// --- Drag and Drop ---

function initializeSortable() {
    document.querySelectorAll('.kanban-column').forEach(column => {
        new Sortable(column, {
            group: 'tickets',
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            handle: '.ticket-card',
            draggable: '.ticket-card',
            swapThreshold: 0.2,
            invertSwap: false,
            forceFallback: false,
            fallbackOnBody: true,
            onEnd: async function(evt) {
                const ticketId = evt.item.dataset.ticketId;
                const newStatus = evt.to.dataset.status;
                const oldStatus = evt.from.dataset.status;

                if (evt.oldIndex === evt.newIndex && evt.from === evt.to) return;

                try {
                    const response = await fetch(`/api/tickets/${ticketId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                    });

                    if (!response.ok) throw new Error('Failed to update status');

                    const label = STATUS_LABELS[newStatus] || newStatus;

                    if (newStatus === 'done' && oldStatus !== 'done') {
                        celebrateCompletion();
                        showToast(`Ticket moved to ${label}`, 'success', 'Ticket Updated');
                    } else {
                        showToast(`Ticket moved to ${label}`, 'info', 'Ticket Updated');
                    }

                    updateColumnCounts();
                } catch (error) {
                    console.error('Error updating ticket status:', error);
                    showErrorToast('Failed to update ticket status. Please try again.');
                    window.location.reload();
                }
            },
        });
    });
}

function updateColumnCounts() {
    document.querySelectorAll('.kanban-column').forEach(column => {
        const count = column.querySelectorAll('.ticket-card:not(.hidden-by-filter)').length;
        const container = column.closest('.kanban-column-container') || column.closest('.bg-surface-100');
        const header = container ? container.querySelector('h2 span.text-gray-500') : null;
        if (header) header.textContent = `(${count})`;
    });
}

// --- Project Filtering ---

function getSelectedProjectIds() {
    const selected = new Set();
    document.querySelectorAll('.project-filter-checkbox').forEach(cb => {
        if (cb.checked) selected.add(cb.value);
    });
    return selected;
}

function filterProjectsBySearch(searchTerm) {
    const searchLower = searchTerm.toLowerCase().trim();
    const clearBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('projectFilterDropdown');

    clearBtn.classList.toggle('hidden', searchTerm.length === 0);
    dropdown.classList.toggle('hidden', searchTerm.length === 0);

    document.querySelectorAll('.project-filter-item').forEach(item => {
        const projectName = item.dataset.projectName || '';
        item.classList.toggle('hidden', !projectName.includes(searchLower));
    });

    updateProjectFilter();
}

function clearProjectSearch() {
    const searchInput = document.getElementById('projectSearch');
    searchInput.value = '';
    filterProjectsBySearch('');
}

function selectAllProjects() {
    document.querySelectorAll('.project-filter-checkbox').forEach(cb => { cb.checked = true; });
    updateProjectFilter();
}

function selectNoneProjects() {
    document.querySelectorAll('.project-filter-checkbox').forEach(cb => { cb.checked = false; });
    updateProjectFilter();
}

function updateProjectFilter() {
    saveProjectFilterState(getSelectedProjectIds());
    applyAllFilters();
}

function applyAllFilters() {
    const selectedProjects = getSelectedProjectIds();
    const dateRangeSelect = document.getElementById('dateRangeFilter');
    const days = dateRangeSelect ? parseInt(dateRangeSelect.value) || 0 : 0;
    const cutoffDate = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
    const hideDeprecated = loadHideDeprecatedSetting();

    document.querySelectorAll('.ticket-card').forEach(card => {
        const projectId = card.dataset.projectId;
        const isDeprecated = card.dataset.deprecated === 'true';
        const ticketDate = new Date(parseFloat(card.dataset.timestamp || 0) * 1000);
        const dateOk = !cutoffDate || ticketDate >= cutoffDate;
        const visible = isDeprecated ? (!hideDeprecated && dateOk) : (selectedProjects.has(projectId) && dateOk);
        card.classList.toggle('hidden-by-filter', !visible);
    });

    updateColumnCounts();
    sortTickets();
}

function applyDateRangeFilter() {
    const dateRangeSelect = document.getElementById('dateRangeFilter');
    if (dateRangeSelect) {
        localStorage.setItem('dateRangeFilter', (parseInt(dateRangeSelect.value) || 0).toString());
        applyAllFilters();
    }
}

// --- Sorting ---

function removeEmojis(str) {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{1F1E0}-\u{1F1FF}]/gu;
    return str.replace(emojiRegex, '').trim();
}

function sortTickets() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;

    if (!sortSelect.value) {
        sortSelect.value = localStorage.getItem('defaultSortOrder') || 'date-desc';
    }

    const sortValue = sortSelect.value;

    document.querySelectorAll('.kanban-column').forEach(column => {
        const tickets = Array.from(column.querySelectorAll('.ticket-card:not(.hidden-by-filter)'));
        if (tickets.length === 0) return;

        tickets.sort((a, b) => {
            if (sortValue.startsWith('date-')) {
                const diff = parseFloat(a.dataset.timestamp || 0) - parseFloat(b.dataset.timestamp || 0);
                return sortValue === 'date-desc' ? -diff : diff;
            }
            if (sortValue.startsWith('project-')) {
                const nameA = removeEmojis((a.dataset.projectName || '').toLowerCase());
                const nameB = removeEmojis((b.dataset.projectName || '').toLowerCase());
                const cmp = nameA.localeCompare(nameB);
                return sortValue === 'project-asc' ? cmp : -cmp;
            }
            return 0;
        });

        tickets.forEach(ticket => column.appendChild(ticket));
    });
}

// --- Ticket Modal ---

function openNewTicketModal() {
    const modal = document.getElementById('ticketModal');

    document.getElementById('ticketForm').reset();
    document.getElementById('ticketId').value = '';
    document.getElementById('modalTitle').textContent = 'New Ticket';
    document.getElementById('ticketIdBadge').classList.add('hidden');
    document.getElementById('statusField').classList.add('hidden');
    document.getElementById('deleteTicketBtn').classList.add('hidden');

    _ticketModalPrevFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.querySelector('input, select, textarea, button')?.focus();
}

async function editTicket(ticketId) {
    const modal = document.getElementById('ticketModal');

    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) throw new Error('Failed to fetch ticket');

        const ticket = await response.json();

        document.getElementById('ticketId').value = ticket.id;
        document.getElementById('ticketTitle').value = ticket.title;
        document.getElementById('ticketProject').value = ticket.project_id;
        const statusEl = document.getElementById('ticketStatus');
        statusEl.value = ticket.status;
        statusEl.dataset.originalStatus = ticket.status;
        const descValue = ticket.description || '';
        document.getElementById('ticketDescription').value = descValue;
        document.getElementById('modalTitle').textContent = 'Edit Ticket';
        const badge = document.getElementById('ticketIdBadge');
        badge.textContent = ticket.ticket_id;
        badge.classList.remove('hidden');
        document.getElementById('statusField').classList.remove('hidden');
        document.getElementById('deleteTicketBtn').classList.remove('hidden');

        // open in markdown preview mode by default
        if (descValue.trim()) {
            const preview = document.getElementById('descPreview');
            preview.innerHTML = marked.parse(descValue);
            preview.classList.remove('hidden');
            document.getElementById('ticketDescription').classList.add('hidden');
            document.getElementById('descToggleBtn').textContent = 'Edit';
        }

        _ticketModalPrevFocus = document.activeElement;
        modal.classList.remove('hidden');
        modal.querySelector('input, select, textarea, button')?.focus();
    } catch (error) {
        console.error('Error fetching ticket:', error);
        showErrorToast('Failed to load ticket details');
    }
}

function closeTicketModal() {
    document.getElementById('ticketModal').classList.add('hidden');
    _ticketModalPrevFocus?.focus();
    _ticketModalPrevFocus = null;
    // reset description to edit mode
    document.getElementById('ticketDescription').classList.remove('hidden');
    document.getElementById('descPreview').classList.add('hidden');
    document.getElementById('descToggleBtn').textContent = 'Preview';
}

function toggleDescriptionPreview() {
    const textarea = document.getElementById('ticketDescription');
    const preview = document.getElementById('descPreview');
    const btn = document.getElementById('descToggleBtn');
    const isEditing = !textarea.classList.contains('hidden');
    if (isEditing) {
        preview.innerHTML = marked.parse(textarea.value || '');
        preview.classList.remove('hidden');
        textarea.classList.add('hidden');
        btn.textContent = 'Edit';
    } else {
        textarea.classList.remove('hidden');
        preview.classList.add('hidden');
        btn.textContent = 'Preview';
    }
}

async function saveTicket(event) {
    event.preventDefault();

    const ticketId = document.getElementById('ticketId').value;
    const isNew = !ticketId;
    const submitBtn = event.target.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    const data = {
        title: document.getElementById('ticketTitle').value,
        project_id: parseInt(document.getElementById('ticketProject').value),
        description: document.getElementById('ticketDescription').value || null,
    };

    const statusSelect = document.getElementById('ticketStatus');
    const oldStatus = statusSelect.dataset.originalStatus;
    if (!isNew) data.status = statusSelect.value;

    try {
        const url = isNew ? '/api/tickets' : `/api/tickets/${ticketId}`;
        const response = await fetch(url, {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to save ticket');
        }

        if (!isNew && data.status === 'done' && oldStatus !== 'done') {
            celebrateCompletion();
        }
        showSuccessToast(isNew ? 'Ticket created successfully' : 'Ticket updated successfully');
        setTimeout(() => window.location.reload(), 500);
    } catch (error) {
        console.error('Error saving ticket:', error);
        showErrorToast(error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteCurrentTicket() {
    const ticketId = document.getElementById('ticketId').value;
    if (!ticketId) return;

    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
        const response = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete ticket');

        showSuccessToast('Ticket deleted successfully');
        setTimeout(() => window.location.reload(), 500);
    } catch (error) {
        console.error('Error deleting ticket:', error);
        showErrorToast('Failed to delete ticket');
    }
}

// --- Project tickets popout ---

function getProjectTicketsData() {
    if (_projectTicketsData) return _projectTicketsData;
    const el = document.getElementById('project-tickets-data');
    if (!el) return null;
    _projectTicketsData = JSON.parse(el.textContent);
    return _projectTicketsData;
}

function toggleProjectTicketsPopout(projectId, anchorEl) {
    const popout = document.getElementById('projectTicketsPopout');
    if (!popout) return;

    const projectKey = String(projectId);
    if (popout.dataset.projectId === projectKey && !popout.classList.contains('hidden')) {
        closeProjectTicketsPopout();
        return;
    }

    openProjectTicketsPopout(projectId, anchorEl);
}

function openProjectTicketsPopout(projectId, anchorEl) {
    const popout = document.getElementById('projectTicketsPopout');
    const data = getProjectTicketsData();
    if (!popout || !data) return;

    const project = data[String(projectId)];
    if (!project) return;

    renderProjectTicketsList(project);

    if (_ticketsPopoutAnchor) {
        _ticketsPopoutAnchor.setAttribute('aria-expanded', 'false');
    }

    popout.dataset.projectId = String(projectId);
    _ticketsPopoutAnchor = anchorEl;
    anchorEl.setAttribute('aria-expanded', 'true');

    popout.classList.remove('hidden');
    positionProjectTicketsPopout(popout, anchorEl);
    document.getElementById('projectTicketsPopoutClose')?.focus();
}

function closeProjectTicketsPopout() {
    const popout = document.getElementById('projectTicketsPopout');
    if (!popout || popout.classList.contains('hidden')) return;

    popout.classList.add('hidden');
    delete popout.dataset.projectId;
    if (_ticketsPopoutAnchor) {
        _ticketsPopoutAnchor.setAttribute('aria-expanded', 'false');
        _ticketsPopoutAnchor.focus();
    }
    _ticketsPopoutAnchor = null;
}

function positionProjectTicketsPopout(popout, anchorEl) {
    const margin = 6;
    const rect = anchorEl.getBoundingClientRect();
    const popoutWidth = popout.offsetWidth;
    const popoutHeight = popout.offsetHeight;

    let top = rect.bottom + margin;
    let left = rect.right - popoutWidth;

    if (left < 8) left = 8;
    if (left + popoutWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoutWidth - 8;
    }
    if (top + popoutHeight > window.innerHeight - 8) {
        top = rect.top - popoutHeight - margin;
    }

    popout.style.top = `${top}px`;
    popout.style.left = `${left}px`;
}

function renderProjectTicketsList(project) {
    const list = document.getElementById('projectTicketsPopoutList');
    if (!list) return;

    list.replaceChildren();

    if (project.tickets.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'px-3 py-6 text-center text-sm text-gray-500';
        empty.textContent = 'No tickets yet';
        list.appendChild(empty);
        return;
    }

    for (const ticket of project.tickets) {
        list.appendChild(createProjectTicketListItem(ticket));
    }
}

function createProjectTicketListItem(ticket) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors';
    button.setAttribute('role', 'option');
    button.addEventListener('click', () => {
        closeProjectTicketsPopout();
        editTicket(ticket.id);
    });

    const statusColor = STATUS_COLORS[ticket.status] || '#9ca3af';
    const status = document.createElement('span');
    status.className = 'text-[11px] font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0';
    status.style.color = statusColor;
    status.style.backgroundColor = `color-mix(in srgb, ${statusColor} 15%, transparent)`;
    status.textContent = STATUS_LABELS[ticket.status] || ticket.status;

    const ticketTitle = document.createElement('p');
    ticketTitle.className = 'text-sm text-white leading-snug line-clamp-2';
    ticketTitle.textContent = ticket.title;

    const ticketIdEl = document.createElement('p');
    ticketIdEl.className = 'text-[11px] font-mono text-gray-500 mt-0.5';
    ticketIdEl.textContent = ticket.ticket_id;

    const main = document.createElement('div');
    main.className = 'min-w-0 flex-1';
    main.append(ticketTitle, ticketIdEl);

    const row = document.createElement('div');
    row.className = 'flex items-start justify-between gap-2';
    row.append(main, status);

    button.append(row);
    item.append(button);
    return item;
}

// --- Project Modal ---

function openNewProjectModal() {
    const modal = document.getElementById('projectModal');

    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('projectDeprecated').checked = false;
    document.getElementById('projectModalTitle').textContent = 'New Project';
    document.getElementById('deleteProjectBtn').classList.add('hidden');

    _projectModalPrevFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.querySelector('input, select, textarea, button')?.focus();
}

async function editProject(projectId) {
    const modal = document.getElementById('projectModal');

    try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch project');

        const project = await response.json();

        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('projectDeprecated').checked = !!project.deprecated;
        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        document.getElementById('deleteProjectBtn').classList.remove('hidden');

        _projectModalPrevFocus = document.activeElement;
        modal.classList.remove('hidden');
        modal.querySelector('input, select, textarea, button')?.focus();
    } catch (error) {
        console.error('Error fetching project:', error);
        showErrorToast('Failed to load project details');
    }
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.add('hidden');
    _projectModalPrevFocus?.focus();
    _projectModalPrevFocus = null;
}

async function saveProject(event) {
    event.preventDefault();

    const projectId = document.getElementById('projectId').value;
    const isNew = !projectId;
    const submitBtn = event.target.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    const data = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        deprecated: document.getElementById('projectDeprecated').checked,
    };

    try {
        const url = isNew ? '/api/projects' : `/api/projects/${projectId}`;
        const response = await fetch(url, {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to save project');
        }

        showSuccessToast(isNew ? 'Project created successfully' : 'Project updated successfully');
        setTimeout(() => window.location.reload(), 500);
    } catch (error) {
        console.error('Error saving project:', error);
        showErrorToast(error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteCurrentProject() {
    const projectId = document.getElementById('projectId').value;
    if (!projectId) return;

    if (!confirm('Are you sure you want to delete this project? All tickets in this project will also be deleted.')) return;

    try {
        const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete project');

        showSuccessToast('Project deleted successfully');
        setTimeout(() => window.location.reload(), 500);
    } catch (error) {
        console.error('Error deleting project:', error);
        showErrorToast('Failed to delete project');
    }
}

// --- Celebration ---

function celebrateCompletion() {
    const audio = new Audio('/static/kids-cheering.mp3');
    audio.volume = 0.5;
    audio.play().catch(error => console.log('Audio playback failed:', error));

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}

// --- Settings Panel ---

function toggleSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;

    if (panel.classList.contains('hidden')) {
        _settingsPrevFocus = document.activeElement;
        panel.classList.remove('hidden');
        // Double rAF ensures the element is painted before the transition starts
        requestAnimationFrame(() => requestAnimationFrame(() => {
            panel.classList.add('open');
            panel.querySelector('input, select, textarea, button')?.focus();
        }));
    } else {
        panel.classList.remove('open');
        panel.addEventListener('transitionend', () => {
            panel.classList.add('hidden');
            _settingsPrevFocus?.focus();
            _settingsPrevFocus = null;
        }, { once: true });
    }
}

function toggleColumnVisibility(columnName, isVisible) {
    document.querySelectorAll(`.kanban-column-container[data-column="${columnName}"]`).forEach(container => {
        container.style.display = isVisible ? '' : 'none';
    });
    saveColumnVisibility();
    updateGridLayout();
}

function saveColumnVisibility() {
    const visibility = {};
    document.querySelectorAll('.column-toggle').forEach(checkbox => {
        visibility[checkbox.dataset.column] = checkbox.checked;
    });
    localStorage.setItem('columnVisibility', JSON.stringify(visibility));
}

function loadColumnVisibility() {
    const saved = localStorage.getItem('columnVisibility');
    let visibility;
    if (saved) {
        try {
            visibility = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading column visibility:', e);
            return;
        }
    } else {
        visibility = { proposed: false, todo: true, in_progress: true, done: true, wont_do: false };
    }

    document.querySelectorAll('.column-toggle').forEach(checkbox => {
        const column = checkbox.dataset.column;
        if (Object.prototype.hasOwnProperty.call(visibility, column)) {
            checkbox.checked = visibility[column];
            toggleColumnVisibility(column, visibility[column]);
        }
    });
}

function updateGridLayout() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    const visibleColumns = Array.from(document.querySelectorAll('.kanban-column-container[data-column]'))
        .filter(col => col.style.display !== 'none').length;

    const colClasses = {
        1: 'grid grid-cols-1 gap-2 lg:gap-3 w-full',
        2: 'grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3 w-full',
        3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 w-full',
        4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 w-full',
    };
    board.className = colClasses[visibleColumns] || 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 w-full';
}

// --- Default Filter Preferences ---

function saveProjectFilterState(selectedProjects) {
    const projectIds = Array.from(selectedProjects).map(id => parseInt(id));
    localStorage.setItem('projectFilterState', JSON.stringify(projectIds));
}

function loadProjectFilterState() {
    const saved = localStorage.getItem('projectFilterState');
    if (!saved) return false;

    try {
        const projectIds = JSON.parse(saved);
        const projectIdSet = new Set(projectIds.map(id => String(id)));
        document.querySelectorAll('.project-filter-checkbox').forEach(checkbox => {
            checkbox.checked = projectIdSet.has(checkbox.value);
        });
        return true;
    } catch (e) {
        console.error('Error loading project filter state:', e);
        return false;
    }
}

function setDefaultProjectFilter(mode) {
    localStorage.setItem('defaultProjectFilter', mode);
    if (mode === 'all') selectAllProjects();
    else if (mode === 'none') selectNoneProjects();
}

function loadDefaultFilterPreferences() {
    const savedSort = localStorage.getItem('defaultSortOrder');
    const defaultValue = savedSort || 'date-desc';

    const sortSelect = document.getElementById('sortSelect');
    const defaultSortSelect = document.getElementById('defaultSortOrder');
    if (sortSelect) sortSelect.value = defaultValue;
    if (defaultSortSelect) defaultSortSelect.value = defaultValue;

    const savedDateRange = localStorage.getItem('dateRangeFilter');
    const dateRangeSelect = document.getElementById('dateRangeFilter');
    if (dateRangeSelect) dateRangeSelect.value = savedDateRange || '0';

    const defaultFilter = localStorage.getItem('defaultProjectFilter');
    if (defaultFilter) {
        if (!loadProjectFilterState()) {
            if (defaultFilter === 'all') selectAllProjects();
            else if (defaultFilter === 'none') selectNoneProjects();
        }
    } else {
        if (!loadProjectFilterState()) selectAllProjects();
    }

    applyAllFilters();
}

function saveDefaultSortOrder() {
    const sortSelect = document.getElementById('defaultSortOrder');
    if (!sortSelect) return;

    localStorage.setItem('defaultSortOrder', sortSelect.value);
    const mainSortSelect = document.getElementById('sortSelect');
    if (mainSortSelect) {
        mainSortSelect.value = sortSelect.value;
        sortTickets();
    }
}

// --- Hide Deprecated ---

function loadHideDeprecatedSetting() {
    const saved = localStorage.getItem('hideDeprecated');
    return saved === null ? true : saved === 'true';
}

function toggleHideDeprecated(checked) {
    localStorage.setItem('hideDeprecated', checked.toString());
    applyAllFilters();
    applyHideDeprecatedToProjects();
}

function applyHideDeprecatedToProjects() {
    const hide = loadHideDeprecatedSetting();
    document.querySelectorAll('[data-deprecated="true"]').forEach(card => {
        if (card.classList.contains('ticket-card')) return;
        card.classList.toggle('hidden', hide);
    });
}

// --- Toast Notifications ---

function _makeSvgIcon(pathData, strokeColor, cssClass) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', cssClass);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', strokeColor);
    svg.setAttribute('viewBox', '0 0 24 24');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', pathData);
    svg.appendChild(path);
    return svg;
}

function showToast(message, type = 'info', title = null) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const iconColor = type === 'success' ? '#30d158' : type === 'error' ? '#ff453a' : '#0a84ff';
    const toastTitle = title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const content = document.createElement('div');
    content.className = 'toast-content';
    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = toastTitle;
    const msgEl = document.createElement('div');
    msgEl.className = 'toast-message';
    msgEl.textContent = message;
    content.appendChild(titleEl);
    content.appendChild(msgEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.appendChild(_makeSvgIcon('M6 18L18 6M6 6l12 12', 'currentColor', 'w-4 h-4'));
    closeBtn.addEventListener('click', () => toast.remove());

    toast.appendChild(_makeSvgIcon(TOAST_ICON_PATHS[type] || TOAST_ICON_PATHS.info, iconColor, 'toast-icon'));
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.parentElement && toast.remove(), 200);
    }, 4000);
}

function showSuccessToast(message, title = 'Success') {
    showToast(message, 'success', title);
}

function showErrorToast(message, title = 'Error') {
    showToast(message, 'error', title);
}

function showInfoToast(message, title = 'Info') {
    showToast(message, 'info', title);
}
