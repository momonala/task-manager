/**
 * @typedef {Object} CardFilters
 * @property {Set<string>} selectedProjectIds
 * @property {boolean} hideDeprecated
 * @property {number | null} days  Null when the stored range matches no date range option.
 *
 * @typedef {Object} FilterableCard
 * @property {string} projectId
 * @property {boolean} deprecated
 * @property {number} createdAtSeconds
 */

const FILTER_STORAGE_KEYS = {
    selectedProjectIds: 'projectFilterState',
    knownProjectIds: 'projectFilterKnownIds',
    defaultProjectMode: 'defaultProjectFilter',
    days: 'dateRangeFilter',
    hideDeprecated: 'hideDeprecated',
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {FilterableCard} card
 * @param {CardFilters} filters
 * @param {number} now
 */
function cardVisibility(card, filters, now = Date.now()) {
    const cutoff = filters.days > 0 ? new Date(now - filters.days * DAY_MS) : null;
    const dateOk = !cutoff || new Date(card.createdAtSeconds * 1000) >= cutoff;
    if (card.deprecated) return !filters.hideDeprecated && dateOk;
    return filters.selectedProjectIds.has(card.projectId) && dateOk;
}

function restoreProjectSelection(storage, projectIds) {
    const saved = storage.getItem(FILTER_STORAGE_KEYS.selectedProjectIds);
    if (!saved) return null;

    try {
        const savedIds = new Set(JSON.parse(saved).map(String));
        const savedKnownIds = storage.getItem(FILTER_STORAGE_KEYS.knownProjectIds);
        const knownIds = savedKnownIds ? new Set(JSON.parse(savedKnownIds).map(String)) : savedIds;
        const hasNewProject = projectIds.some(id => !knownIds.has(id));
        const selected = new Set(projectIds.filter(id => !knownIds.has(id) || savedIds.has(id)));
        return { selectedProjectIds: selected, unsaved: hasNewProject };
    } catch (e) {
        console.error('Error loading project filter state:', e);
        return null;
    }
}

function loadProjectSelection(storage, projectIds) {
    const restored = restoreProjectSelection(storage, projectIds);
    if (restored) return restored;

    const mode = storage.getItem(FILTER_STORAGE_KEYS.defaultProjectMode);
    if (!mode || mode === 'all') return { selectedProjectIds: new Set(projectIds), unsaved: true };
    if (mode === 'none') return { selectedProjectIds: new Set(), unsaved: true };
    return { selectedProjectIds: new Set(projectIds), unsaved: false };
}

/**
 * @param {Storage} storage
 * @param {string[]} projectIds  Values of the project filter checkboxes, in page order.
 * @param {string[]} dayOptions  Values of the date range options.
 * @returns {{filters: CardFilters, selectionUnsaved: boolean}}
 */
function loadFilters(storage, projectIds, dayOptions) {
    const { selectedProjectIds, unsaved } = loadProjectSelection(storage, projectIds);
    const storedDays = storage.getItem(FILTER_STORAGE_KEYS.days) || '0';
    const storedHideDeprecated = storage.getItem(FILTER_STORAGE_KEYS.hideDeprecated);
    return {
        filters: {
            selectedProjectIds,
            hideDeprecated: storedHideDeprecated === null ? true : storedHideDeprecated === 'true',
            days: dayOptions.includes(storedDays) ? parseInt(storedDays) || 0 : null,
        },
        selectionUnsaved: unsaved,
    };
}

/**
 * Writes only the fields present in `changes`.
 * @param {Storage} storage
 * @param {Partial<CardFilters>} changes
 * @param {string[]} projectIds  Values of the project filter checkboxes, in page order.
 */
function saveFilters(storage, changes, projectIds) {
    if ('selectedProjectIds' in changes) {
        const selected = Array.from(changes.selectedProjectIds, id => parseInt(id));
        storage.setItem(FILTER_STORAGE_KEYS.selectedProjectIds, JSON.stringify(selected));
        storage.setItem(FILTER_STORAGE_KEYS.knownProjectIds, JSON.stringify(projectIds.map(id => parseInt(id))));
    }
    if ('days' in changes) storage.setItem(FILTER_STORAGE_KEYS.days, String(changes.days));
    if ('hideDeprecated' in changes) storage.setItem(FILTER_STORAGE_KEYS.hideDeprecated, String(changes.hideDeprecated));
}

function saveDefaultProjectMode(storage, mode) {
    storage.setItem(FILTER_STORAGE_KEYS.defaultProjectMode, mode);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cardVisibility, loadFilters, saveFilters, saveDefaultProjectMode, FILTER_STORAGE_KEYS, DAY_MS };
}
