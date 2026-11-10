const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { cardVisibility, filtersForRun, loadHideDeprecated, loadFilters, saveFilters, saveDefaultProjectMode, DAY_MS } = require(
    path.join(__dirname, '../../static/js/card-filters.js'),
);

const NOW = 1_700_000_000_000;
const DAYS = 7;
const CUTOFF_SECONDS = (NOW - DAYS * DAY_MS) / 1000;
const CREATED_AT = {
    inside: CUTOFF_SECONDS + 1,
    boundary: CUTOFF_SECONDS,
    outside: CUTOFF_SECONDS - 1,
};
const DAY_OPTIONS = ['0', '1', '7', '30', '90', '180', '365'];

class FakeStorage {
    constructor(entries = {}) {
        this.items = new Map(Object.entries(entries));
    }
    getItem(key) {
        return this.items.has(key) ? this.items.get(key) : null;
    }
    setItem(key, value) {
        this.items.set(key, String(value));
    }
    snapshot() {
        return Object.fromEntries(this.items);
    }
}

function visible({ selected, deprecated, hideDeprecated, date, days = DAYS }) {
    const card = { projectId: '5', deprecated, createdAtSeconds: CREATED_AT[date] };
    const filters = { selectedProjectIds: new Set(selected ? ['5'] : ['9']), hideDeprecated, days };
    return cardVisibility(card, filters, NOW);
}

const VISIBILITY_TABLE = [
    // selected, deprecated, hideDeprecated, date, expected
    [true, false, false, 'inside', true],
    [true, false, false, 'boundary', true],
    [true, false, false, 'outside', false],
    [true, false, true, 'inside', true],
    [true, false, true, 'boundary', true],
    [true, false, true, 'outside', false],
    [false, false, false, 'inside', false],
    [false, false, false, 'boundary', false],
    [false, false, false, 'outside', false],
    [false, false, true, 'inside', false],
    [false, false, true, 'boundary', false],
    [false, false, true, 'outside', false],
    [true, true, false, 'inside', true],
    [true, true, false, 'boundary', true],
    [true, true, false, 'outside', false],
    [true, true, true, 'inside', false],
    [true, true, true, 'boundary', false],
    [true, true, true, 'outside', false],
    [false, true, false, 'inside', true],
    [false, true, false, 'boundary', true],
    [false, true, false, 'outside', false],
    [false, true, true, 'inside', false],
    [false, true, true, 'boundary', false],
    [false, true, true, 'outside', false],
];

for (const [selected, deprecated, hideDeprecated, date, expected] of VISIBILITY_TABLE) {
    const name = `visibility: selected=${selected} deprecated=${deprecated} hideDeprecated=${hideDeprecated} date=${date}`;
    test(name, () => {
        assert.equal(visible({ selected, deprecated, hideDeprecated, date }), expected);
    });
}

for (const days of [0, null]) {
    test(`visibility: days=${days} applies no date cutoff`, () => {
        const card = { projectId: '5', deprecated: false, createdAtSeconds: 0 };
        const filters = { selectedProjectIds: new Set(['5']), hideDeprecated: true, days };
        assert.equal(cardVisibility(card, filters, NOW), true);
        assert.equal(cardVisibility({ ...card, deprecated: true }, { ...filters, hideDeprecated: false }, NOW), true);
        assert.equal(cardVisibility({ ...card, projectId: '6' }, filters, NOW), false);
    });
}

test('visibility: an unparseable timestamp is hidden once a cutoff applies', () => {
    const card = { projectId: '5', deprecated: false, createdAtSeconds: NaN };
    const filters = { selectedProjectIds: new Set(['5']), hideDeprecated: true, days: 1 };
    assert.equal(cardVisibility(card, filters, NOW), false);
    assert.equal(cardVisibility(card, { ...filters, days: 0 }, NOW), true);
});

const PROJECTS = ['1', '2', '3'];

function load(entries, projectIds = PROJECTS) {
    const { filters, selectionUnsaved } = loadFilters(new FakeStorage(entries), projectIds, DAY_OPTIONS);
    return { ...filters, selectedProjectIds: [...filters.selectedProjectIds], selectionUnsaved };
}

test('load: empty storage selects every project and shows all dates', () => {
    assert.deepEqual(load({}), {
        selectedProjectIds: ['1', '2', '3'],
        days: 0,
        selectionUnsaved: true,
    });
});

for (const [mode, selected, unsaved] of [
    ['all', ['1', '2', '3'], true],
    ['', ['1', '2', '3'], true],
    ['none', [], true],
    ['bogus', ['1', '2', '3'], false],
]) {
    test(`load: no saved selection with default mode ${JSON.stringify(mode)}`, () => {
        const loaded = load({ defaultProjectFilter: mode });
        assert.deepEqual(loaded.selectedProjectIds, selected);
        assert.equal(loaded.selectionUnsaved, unsaved);
    });
}

test('load: saved selection wins over the default mode', () => {
    const loaded = load({ projectFilterState: '[2]', projectFilterKnownIds: '[1,2,3]', defaultProjectFilter: 'none' });
    assert.deepEqual(loaded.selectedProjectIds, ['2']);
    assert.equal(loaded.selectionUnsaved, false);
});

test('load: a saved empty selection stays empty', () => {
    const loaded = load({ projectFilterState: '[]', projectFilterKnownIds: '[1,2,3]' });
    assert.deepEqual(loaded.selectedProjectIds, []);
    assert.equal(loaded.selectionUnsaved, false);
});

test('load: a project missing from the known ids is selected and marks the selection unsaved', () => {
    const loaded = load({ projectFilterState: '[1]', projectFilterKnownIds: '[1,2]' });
    assert.deepEqual(loaded.selectedProjectIds, ['1', '3']);
    assert.equal(loaded.selectionUnsaved, true);
});

test('load: without known ids, projects outside the saved selection count as new', () => {
    const loaded = load({ projectFilterState: '[1]' });
    assert.deepEqual(loaded.selectedProjectIds, ['1', '2', '3']);
    assert.equal(loaded.selectionUnsaved, true);
});

test('load: saved ids for projects no longer on the page are dropped', () => {
    const loaded = load({ projectFilterState: '[1,4]', projectFilterKnownIds: '[1,2,4]' }, ['1', '2']);
    assert.deepEqual(loaded.selectedProjectIds, ['1']);
    assert.equal(loaded.selectionUnsaved, false);
});

test('load: selection follows page order, not saved order', () => {
    const loaded = load({ projectFilterState: '[3,1]', projectFilterKnownIds: '[3,2,1]' });
    assert.deepEqual(loaded.selectedProjectIds, ['1', '3']);
});

for (const [label, entries] of [
    ['invalid JSON selection', { projectFilterState: 'not json' }],
    ['non-array selection', { projectFilterState: '{}' }],
    ['null selection', { projectFilterState: 'null' }],
    ['invalid JSON known ids', { projectFilterState: '[1]', projectFilterKnownIds: '[1,' }],
]) {
    test(`load: corrupt ${label} falls back to the default mode`, (t) => {
        const errors = t.mock.method(console, 'error', () => {});
        const loaded = load({ ...entries, defaultProjectFilter: 'none' });
        assert.deepEqual(loaded.selectedProjectIds, []);
        assert.equal(loaded.selectionUnsaved, true);
        assert.equal(errors.mock.callCount(), 1);
    });
}

test('load: an empty saved selection string falls back without logging', (t) => {
    const errors = t.mock.method(console, 'error', () => {});
    const loaded = load({ projectFilterState: '', defaultProjectFilter: 'bogus' });
    assert.deepEqual(loaded.selectedProjectIds, ['1', '2', '3']);
    assert.equal(loaded.selectionUnsaved, false);
    assert.equal(errors.mock.callCount(), 0);
});

for (const [stored, days] of [
    [undefined, 0],
    ['', 0],
    ['0', 0],
    ['30', 30],
    ['365', 365],
    ['999', null],
    ['abc', null],
    ['7.0', null],
]) {
    test(`load: stored date range ${JSON.stringify(stored)} gives days=${days}`, () => {
        assert.equal(load(stored === undefined ? {} : { dateRangeFilter: stored }).days, days);
    });
}

test('load: date range is null when the page has no date options', () => {
    const { filters } = loadFilters(new FakeStorage({ dateRangeFilter: '7' }), PROJECTS, []);
    assert.equal(filters.days, null);
});

for (const [stored, hide] of [
    [undefined, true],
    ['true', true],
    ['false', false],
    ['', false],
    ['yes', false],
]) {
    test(`load: stored hideDeprecated ${JSON.stringify(stored)} gives ${hide}`, () => {
        assert.equal(loadHideDeprecated(new FakeStorage(stored === undefined ? {} : { hideDeprecated: stored })), hide);
    });
}

test('save: selection writes integer ids and the page project ids as known', () => {
    const storage = new FakeStorage();
    saveFilters(storage, { selectedProjectIds: new Set(['3', '1']) }, ['1', '2', '3']);
    assert.deepEqual(storage.snapshot(), { projectFilterState: '[3,1]', projectFilterKnownIds: '[1,2,3]' });
});

test('save: empty selection', () => {
    const storage = new FakeStorage();
    saveFilters(storage, { selectedProjectIds: new Set() }, []);
    assert.deepEqual(storage.snapshot(), { projectFilterState: '[]', projectFilterKnownIds: '[]' });
});

test('save: days and hideDeprecated are written as strings', () => {
    const storage = new FakeStorage();
    saveFilters(storage, { days: 7 }, PROJECTS);
    saveFilters(storage, { hideDeprecated: false }, PROJECTS);
    assert.deepEqual(storage.snapshot(), { dateRangeFilter: '7', hideDeprecated: 'false' });
});

test('save: only the changed fields are written', () => {
    const storage = new FakeStorage({ projectFilterState: '[1]', projectFilterKnownIds: '[1,2]', hideDeprecated: 'yes' });
    saveFilters(storage, { days: 30 }, ['1', '2', '3']);
    assert.deepEqual(storage.snapshot(), {
        projectFilterState: '[1]',
        projectFilterKnownIds: '[1,2]',
        hideDeprecated: 'yes',
        dateRangeFilter: '30',
    });
});

test('save: default project mode', () => {
    const storage = new FakeStorage();
    saveDefaultProjectMode(storage, 'none');
    assert.deepEqual(storage.snapshot(), { defaultProjectFilter: 'none' });
});

test('round trip: saved filters load back unchanged', () => {
    const storage = new FakeStorage();
    const filters = { selectedProjectIds: new Set(['2']), days: 90 };
    saveFilters(storage, { ...filters, hideDeprecated: false }, PROJECTS);
    assert.deepEqual(loadFilters(storage, PROJECTS, DAY_OPTIONS), { filters, selectionUnsaved: false });
    assert.equal(loadHideDeprecated(storage), false);
});

test('filter run: hideDeprecated is re-read from storage on every run', () => {
    const storage = new FakeStorage({ hideDeprecated: 'true' });
    const { filters } = loadFilters(storage, PROJECTS, DAY_OPTIONS);
    const deprecatedCard = { projectId: '9', deprecated: true, createdAtSeconds: CREATED_AT.inside };

    assert.equal(cardVisibility(deprecatedCard, filtersForRun(filters, storage), NOW), false);
    storage.setItem('hideDeprecated', 'false');
    assert.equal(cardVisibility(deprecatedCard, filtersForRun(filters, storage), NOW), true);
    storage.setItem('hideDeprecated', 'true');
    assert.equal(filtersForRun(filters, storage).hideDeprecated, true);
});

test('filter run: other fields come from the in-memory filters', () => {
    const storage = new FakeStorage({ projectFilterState: '[2]', dateRangeFilter: '30' });
    const filters = { selectedProjectIds: new Set(['1']), days: 7 };
    const run = filtersForRun(filters, storage);
    assert.deepEqual([...run.selectedProjectIds], ['1']);
    assert.equal(run.days, 7);
});
