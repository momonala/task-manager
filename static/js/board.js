/**
 * Task Board - Kanban Board JavaScript
 * Handles drag-and-drop, modals, and API interactions
 */

// Initialize drag-and-drop on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSortable();
    // Load all preferences
    loadColumnVisibility();
    loadDefaultFilterPreferences();
    // Apply sorting (will use default if no saved preference)
    sortTickets();
});

// --- Drag and Drop ---

function initializeSortable() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
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
                
                // Don't update if dropped in same column at same position
                if (evt.oldIndex === evt.newIndex && evt.from === evt.to) {
                    return;
                }
                
                try {
                    const response = await fetch(`/api/tickets/${ticketId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to update status');
                    }
                    
                    // Get status label and color for toast
                    const statusLabels = {
                        'proposed': 'Proposed',
                        'todo': 'To Do',
                        'in_progress': 'In Progress',
                        'done': 'Done',
                        'wont_do': "Won't Do"
                    };
                    
                    const statusColors = {
                        'proposed': '#bf5af2',  // purple
                        'todo': '#ffd60a',      // mustard yellow
                        'in_progress': '#0a84ff', // blue
                        'done': '#30d158',      // green
                        'wont_do': '#6b7280'    // gray
                    };
                    
                    const columnColor = statusColors[newStatus] || '#0a84ff';
                    
                    // Celebrate when moving to Done!
                    if (newStatus === 'done' && oldStatus !== 'done') {
                        celebrateCompletion();
                        showToast(`Ticket moved to ${statusLabels[newStatus] || newStatus}`, 'success', 'Ticket Updated', columnColor);
                    } else {
                        showToast(`Ticket moved to ${statusLabels[newStatus] || newStatus}`, 'info', 'Ticket Updated', columnColor);
                    }
                    
                    // Update column counts
                    updateColumnCounts();
                } catch (error) {
                    console.error('Error updating ticket status:', error);
                    showErrorToast('Failed to update ticket status. Please try again.');
                    // Revert the drag by reloading (simple approach for MVP)
                    window.location.reload();
                }
            }
        });
    });
}

function updateColumnCounts() {
    document.querySelectorAll('.kanban-column').forEach(column => {
        const count = column.querySelectorAll('.ticket-card:not(.hidden-by-filter)').length;
        const container = column.closest('.kanban-column-container') || column.closest('.bg-surface-100');
        const header = container ? container.querySelector('h2 span.text-gray-500, h2 span.text-gray-600') : null;
        if (header) {
            header.textContent = `(${count})`;
        }
    });
}

// --- Project Filtering ---

function filterProjectsBySearch(searchTerm) {
    const searchLower = searchTerm.toLowerCase().trim();
    const clearBtn = document.getElementById('clearSearchBtn');
    const dropdown = document.getElementById('projectFilterDropdown');
    const projectItems = document.querySelectorAll('.project-filter-item');
    
    // Show/hide clear button
    if (searchTerm.length > 0) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
    
    // Show dropdown when typing
    if (searchTerm.length > 0) {
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
    
    // Filter project items by search term
    let visibleCount = 0;
    projectItems.forEach(item => {
        const projectName = item.dataset.projectName || '';
        if (projectName.includes(searchLower)) {
            item.classList.remove('hidden');
            visibleCount++;
        } else {
            item.classList.add('hidden');
        }
    });
    
    // Update filter based on visible/checked items
    updateProjectFilter();
}

function clearProjectSearch() {
    const searchInput = document.getElementById('projectSearch');
    searchInput.value = '';
    filterProjectsBySearch('');
}

// Show dropdown on focus
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('projectSearch');
    const dropdown = document.getElementById('projectFilterDropdown');
    
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            dropdown.classList.remove('hidden');
        });
    }
});

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    const searchInput = document.getElementById('projectSearch');
    const dropdown = document.getElementById('projectFilterDropdown');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (!searchInput.contains(event.target) && 
        !dropdown.contains(event.target) && 
        !clearBtn.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

function selectAllProjects() {
    const checkboxes = document.querySelectorAll('.project-filter-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = true;
    });
    updateProjectFilter();
}

function selectNoneProjects() {
    const checkboxes = document.querySelectorAll('.project-filter-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
    updateProjectFilter();
}

function updateProjectFilter() {
    const checkboxes = document.querySelectorAll('.project-filter-checkbox');
    const selectedProjects = new Set();
    
    // Collect selected project IDs
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedProjects.add(checkbox.value);
        }
    });
    
    // Save current filter state
    saveProjectFilterState(selectedProjects);
    
    // Apply all filters (project + date range)
    applyAllFilters();
}

function applyAllFilters() {
    const checkboxes = document.querySelectorAll('.project-filter-checkbox');
    const selectedProjects = new Set();
    
    // Collect selected project IDs
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedProjects.add(checkbox.value);
        }
    });
    
    // Get date range filter
    const dateRangeSelect = document.getElementById('dateRangeFilter');
    const days = dateRangeSelect ? parseInt(dateRangeSelect.value) || 0 : 0;
    const cutoffDate = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
    
    // Apply filters to tickets
    const cards = document.querySelectorAll('.ticket-card');
    
    cards.forEach(card => {
        const projectId = card.dataset.projectId;
        const timestamp = parseFloat(card.dataset.timestamp || 0);
        const ticketDate = new Date(timestamp * 1000);
        
        let visible = true;
        
        // Check project filter
        if (!selectedProjects.has(projectId)) {
            visible = false;
        }
        
        // Check date range filter
        if (visible && cutoffDate && ticketDate < cutoffDate) {
            visible = false;
        }
        
        // Apply visibility
        if (visible) {
            card.classList.remove('hidden-by-filter');
        } else {
            card.classList.add('hidden-by-filter');
        }
    });
    
    updateColumnCounts();
    
    // Re-apply sorting after filtering
    sortTickets();
}

function applyDateRangeFilter() {
    const dateRangeSelect = document.getElementById('dateRangeFilter');
    if (dateRangeSelect) {
        const days = parseInt(dateRangeSelect.value) || 0;
        localStorage.setItem('dateRangeFilter', days.toString());
        applyAllFilters();
    }
}

// --- Sorting ---

function removeEmojis(str) {
    // Remove emojis and other Unicode symbols that interfere with sorting
    // Comprehensive emoji removal covering:
    // - Emoticons, symbols, pictographs, and their variations
    // - Zero-width joiners and variation selectors
    // - Common symbol ranges
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{1F1E0}-\u{1F1FF}]/gu;
    return str.replace(emojiRegex, '').trim();
}

function sortTickets() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return; // Exit if sort select doesn't exist yet
    
    // Load default sort order if no value is set
    if (!sortSelect.value) {
        const savedSort = localStorage.getItem('defaultSortOrder');
        if (savedSort) {
            sortSelect.value = savedSort;
        } else {
            sortSelect.value = 'date-desc'; // Default to newest first
        }
    }
    
    const sortValue = sortSelect.value;
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        const tickets = Array.from(column.querySelectorAll('.ticket-card:not(.hidden-by-filter)'));
        
        if (tickets.length === 0) return; // Skip empty columns
        
        tickets.sort((a, b) => {
            if (sortValue.startsWith('date-')) {
                // Sort by date using timestamp
                const timestampA = parseFloat(a.dataset.timestamp || 0);
                const timestampB = parseFloat(b.dataset.timestamp || 0);
                
                if (sortValue === 'date-desc') {
                    return timestampB - timestampA; // Newest first
                } else {
                    return timestampA - timestampB; // Oldest first
                }
            } else if (sortValue.startsWith('project-')) {
                // Sort by project name using data attribute, removing emojis for comparison
                const projectA = removeEmojis((a.dataset.projectName || '').toLowerCase());
                const projectB = removeEmojis((b.dataset.projectName || '').toLowerCase());
                
                if (sortValue === 'project-asc') {
                    return projectA.localeCompare(projectB); // A-Z
                } else {
                    return projectB.localeCompare(projectA); // Z-A
                }
            }
            return 0;
        });
        
        // Re-append sorted tickets (this maintains drag-and-drop functionality)
        tickets.forEach(ticket => column.appendChild(ticket));
    });
}

// --- Ticket Modal ---

function openNewTicketModal() {
    const modal = document.getElementById('ticketModal');
    const form = document.getElementById('ticketForm');
    const title = document.getElementById('modalTitle');
    const statusField = document.getElementById('statusField');
    const deleteBtn = document.getElementById('deleteTicketBtn');
    
    form.reset();
    document.getElementById('ticketId').value = '';
    title.textContent = 'New Ticket';
    statusField.classList.add('hidden');
    deleteBtn.classList.add('hidden');
    
    modal.classList.remove('hidden');
}

async function editTicket(ticketId) {
    const modal = document.getElementById('ticketModal');
    const title = document.getElementById('modalTitle');
    const statusField = document.getElementById('statusField');
    const deleteBtn = document.getElementById('deleteTicketBtn');
    
    try {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) throw new Error('Failed to fetch ticket');
        
        const ticket = await response.json();
        
        document.getElementById('ticketId').value = ticket.id;
        document.getElementById('ticketTitle').value = ticket.title;
        document.getElementById('ticketProject').value = ticket.project_id;
        document.getElementById('ticketStatus').value = ticket.status;
        document.getElementById('ticketDescription').value = ticket.description || '';
        document.getElementById('ticketCriteria').value = ticket.acceptance_criteria || '';
        document.getElementById('ticketScope').value = ticket.scope || '';
        document.getElementById('ticketPrompt').value = ticket.prompt || '';
        
        title.textContent = 'Edit Ticket';
        statusField.classList.remove('hidden');
        deleteBtn.classList.remove('hidden');
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching ticket:', error);
        showErrorToast('Failed to load ticket details');
    }
}

function closeTicketModal() {
    const modal = document.getElementById('ticketModal');
    modal.classList.add('hidden');
}

async function saveTicket(event) {
    event.preventDefault();
    
    const ticketId = document.getElementById('ticketId').value;
    const isNew = !ticketId;
    
    const data = {
        title: document.getElementById('ticketTitle').value,
        project_id: parseInt(document.getElementById('ticketProject').value),
        description: document.getElementById('ticketDescription').value || null,
        acceptance_criteria: document.getElementById('ticketCriteria').value || null,
        scope: document.getElementById('ticketScope').value || null,
        prompt: document.getElementById('ticketPrompt').value || null,
    };
    
    if (!isNew) {
        data.status = document.getElementById('ticketStatus').value;
    }
    
    try {
        const url = isNew ? '/api/tickets' : `/api/tickets/${ticketId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save ticket');
        }
        
        showSuccessToast(isNew ? 'Ticket created successfully' : 'Ticket updated successfully');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error('Error saving ticket:', error);
        showErrorToast(error.message);
    }
}

async function deleteCurrentTicket() {
    const ticketId = document.getElementById('ticketId').value;
    if (!ticketId) return;
    
    if (!confirm('Are you sure you want to delete this ticket?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete ticket');
        
        showSuccessToast('Ticket deleted successfully');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error('Error deleting ticket:', error);
        showErrorToast('Failed to delete ticket');
    }
}

// --- Project Modal ---

function openNewProjectModal() {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('projectModalTitle');
    const deleteBtn = document.getElementById('deleteProjectBtn');
    
    form.reset();
    document.getElementById('projectId').value = '';
    title.textContent = 'New Project';
    deleteBtn.classList.add('hidden');
    
    modal.classList.remove('hidden');
}

async function editProject(projectId) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    const deleteBtn = document.getElementById('deleteProjectBtn');
    
    try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error('Failed to fetch project');
        
        const project = await response.json();
        
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description;
        document.getElementById('projectLocalPath').value = project.local_path || '';
        
        title.textContent = 'Edit Project';
        deleteBtn.classList.remove('hidden');
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error fetching project:', error);
        showErrorToast('Failed to load project details');
    }
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.add('hidden');
}

async function saveProject(event) {
    event.preventDefault();
    
    const projectId = document.getElementById('projectId').value;
    const isNew = !projectId;
    
    const data = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        local_path: document.getElementById('projectLocalPath').value,
    };
    
    try {
        const url = isNew ? '/api/projects' : `/api/projects/${projectId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save project');
        }
        
        showSuccessToast(isNew ? 'Project created successfully' : 'Project updated successfully');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error('Error saving project:', error);
        showErrorToast(error.message);
    }
}

async function deleteCurrentProject() {
    const projectId = document.getElementById('projectId').value;
    if (!projectId) return;
    
    if (!confirm('Are you sure you want to delete this project? All tickets in this project will also be deleted.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete project');
        
        showSuccessToast('Project deleted successfully');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error('Error deleting project:', error);
        showErrorToast('Failed to delete project');
    }
}

// --- Directory Picker ---

async function selectDirectory() {
    const input = document.getElementById('projectLocalPath');
    
    // Try to use File System Access API (Chrome/Edge)
    if ('showDirectoryPicker' in window) {
        try {
            const directoryHandle = await window.showDirectoryPicker();
            // Note: File System Access API doesn't give us the path directly
            // We can only work with the handle, but for display we'll use the name
            // User will need to verify/paste the full path
            const dirName = directoryHandle.name;
            if (input.value === '' || !input.value.includes(dirName)) {
                input.value = dirName;
                alert('Directory selected. Please verify or paste the full path if needed.\n\nNote: Browser security prevents accessing full file paths. You may need to paste the complete path manually.');
            }
        } catch (error) {
            // User cancelled or error occurred
            if (error.name !== 'AbortError') {
                console.error('Error selecting directory:', error);
            }
        }
    } else {
        // Fallback: use webkitdirectory input
        const picker = document.getElementById('directoryPicker');
        picker.click();
    }
}

function handleDirectorySelect(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
        const firstFile = files[0];
        const input = document.getElementById('projectLocalPath');
        
        if (firstFile.webkitRelativePath) {
            // Extract directory name from relative path
            const dirName = firstFile.webkitRelativePath.split('/')[0];
            if (input.value === '' || !input.value.includes(dirName)) {
                input.value = dirName;
                alert('Directory selected. Please verify or paste the full path if needed.\n\nNote: Browser security prevents accessing full file paths. You may need to paste the complete path manually.');
            }
        }
    }
    // Reset the input so the same directory can be selected again
    event.target.value = '';
}

// --- Celebration ---

function celebrateCompletion() {
    // Play celebration sound
    const audio = new Audio('/static/kids-cheering.mp3');
    audio.volume = 0.5; // Set volume to 50%
    audio.play().catch(error => {
        console.log('Audio playback failed:', error);
        // Silently fail if audio playback is blocked by browser
    });
    
    // Trigger confetti celebration
    const duration = 3000; // 3 seconds
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Launch confetti from multiple points
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);
}

// --- Settings Panel ---

function toggleSettingsPanel() {
    const panel = document.getElementById('settingsPanel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

function toggleColumnVisibility(columnName, isVisible) {
    const containers = document.querySelectorAll(`.kanban-column-container[data-column="${columnName}"]`);
    
    containers.forEach(container => {
        container.style.display = isVisible ? '' : 'none';
    });
    
    // Save to localStorage
    saveColumnVisibility();
    
    // Update grid layout
    updateGridLayout();
}

function saveColumnVisibility() {
    const visibility = {};
    document.querySelectorAll('.column-toggle').forEach(checkbox => {
        const column = checkbox.dataset.column;
        visibility[column] = checkbox.checked;
    });
    localStorage.setItem('columnVisibility', JSON.stringify(visibility));
}

function loadColumnVisibility() {
    const saved = localStorage.getItem('columnVisibility');
    if (saved) {
        try {
            const visibility = JSON.parse(saved);
            document.querySelectorAll('.column-toggle').forEach(checkbox => {
                const column = checkbox.dataset.column;
                if (visibility.hasOwnProperty(column)) {
                    checkbox.checked = visibility[column];
                    toggleColumnVisibility(column, visibility[column]);
                }
            });
        } catch (e) {
            console.error('Error loading column visibility:', e);
        }
    }
}

function updateGridLayout() {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;
    
    // Count visible columns (including wont_do)
    const visibleColumns = Array.from(document.querySelectorAll('.kanban-column-container[data-column]'))
        .filter(col => col.style.display !== 'none')
        .length;
    
    // Update grid columns based on visible columns
    if (visibleColumns === 1) {
        board.className = 'grid grid-cols-1 gap-2 lg:gap-3 w-full';
    } else if (visibleColumns === 2) {
        board.className = 'grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3 w-full';
    } else if (visibleColumns === 3) {
        board.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 w-full';
    } else if (visibleColumns === 4) {
        board.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 w-full';
    } else {
        board.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 w-full';
    }
}

// --- Default Filter Preferences ---

function saveProjectFilterState(selectedProjects) {
    // Save current project filter state
    const projectIds = Array.from(selectedProjects).map(id => parseInt(id));
    localStorage.setItem('projectFilterState', JSON.stringify(projectIds));
}

function loadProjectFilterState() {
    // Load saved project filter state
    const saved = localStorage.getItem('projectFilterState');
    if (saved) {
        try {
            const projectIds = JSON.parse(saved);
            const projectIdSet = new Set(projectIds.map(id => String(id)));
            
            document.querySelectorAll('.project-filter-checkbox').forEach(checkbox => {
                checkbox.checked = projectIdSet.has(checkbox.value);
            });
            
            // Don't call updateProjectFilter here - it will be called by applyAllFilters
            return true;
        } catch (e) {
            console.error('Error loading project filter state:', e);
        }
    }
    return false;
}

function setDefaultProjectFilter(mode) {
    // Set default project filter preference
    localStorage.setItem('defaultProjectFilter', mode);
    
    // Apply the default immediately
    if (mode === 'all') {
        selectAllProjects();
    } else if (mode === 'none') {
        selectNoneProjects();
    }
}

function loadDefaultFilterPreferences() {
    // Load default sort order
    const savedSort = localStorage.getItem('defaultSortOrder');
    const sortSelect = document.getElementById('sortSelect');
    const defaultSortSelect = document.getElementById('defaultSortOrder');
    
    if (savedSort) {
        if (sortSelect) {
            sortSelect.value = savedSort;
        }
        if (defaultSortSelect) {
            defaultSortSelect.value = savedSort;
        }
    } else {
        // Set default to "date-desc" if nothing saved
        if (sortSelect) {
            sortSelect.value = 'date-desc';
        }
        if (defaultSortSelect) {
            defaultSortSelect.value = 'date-desc';
        }
    }
    
    // Load date range filter
    const savedDateRange = localStorage.getItem('dateRangeFilter');
    const dateRangeSelect = document.getElementById('dateRangeFilter');
    if (dateRangeSelect) {
        if (savedDateRange) {
            dateRangeSelect.value = savedDateRange;
        } else {
            dateRangeSelect.value = '0'; // Default to show all
        }
    }
    
    // Load default project filter preference
    const defaultFilter = localStorage.getItem('defaultProjectFilter');
    if (defaultFilter) {
        // Only apply if there's no saved filter state
        if (!loadProjectFilterState()) {
            if (defaultFilter === 'all') {
                selectAllProjects();
            } else if (defaultFilter === 'none') {
                selectNoneProjects();
            }
        }
    } else {
        // Default to loading saved filter state, or all if none exists
        if (!loadProjectFilterState()) {
            selectAllProjects();
        }
    }
    
    // Apply all filters after loading preferences
    applyAllFilters();
}

function saveDefaultSortOrder() {
    const sortSelect = document.getElementById('defaultSortOrder');
    if (sortSelect) {
        localStorage.setItem('defaultSortOrder', sortSelect.value);
        // Apply the sort order
        const mainSortSelect = document.getElementById('sortSelect');
        if (mainSortSelect) {
            mainSortSelect.value = sortSelect.value;
            sortTickets();
        }
    }
}

// --- Toast Notifications ---

function showToast(message, type = 'info', title = null, borderColor = null) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Set border color if provided
    if (borderColor) {
        toast.style.borderLeftColor = borderColor;
    }
    
    // Icon based on type
    let iconSvg = '';
    let iconColor = '';
    if (type === 'success') {
        iconColor = borderColor || '#30d158'; // Use provided color or default green
        iconSvg = `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${iconColor}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
    } else if (type === 'error') {
        iconColor = '#ff453a'; // Always red for errors
        iconSvg = `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${iconColor}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
    } else {
        iconColor = borderColor || '#0a84ff'; // Use provided color or default blue
        iconSvg = `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${iconColor}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }
    
    const toastTitle = title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info');
    
    toast.innerHTML = `
        ${iconSvg}
        <div class="toast-content">
            <div class="toast-title">${toastTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 200);
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

// Close modals on escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeTicketModal();
        closeProjectModal();
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel && !settingsPanel.classList.contains('hidden')) {
            toggleSettingsPanel();
        }
    }
});

