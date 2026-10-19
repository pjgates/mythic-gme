import { isRecord } from "./guards.js";
export const LIST_KINDS = ['characters', 'threads'];
export const LIST_LABELS = { characters: 'Characters', threads: 'Threads' };
export const GROUP_COUNT = 5;
export const GROUP_SIZE = 5;
export const SLOT_COUNT = GROUP_COUNT * GROUP_SIZE;
export const MAX_COPIES = 3;
/** Every action kind, in the order commands and tool schemas list them. */
export const LIST_ACTION_KINDS = ['add', 'weight', 'unweight', 'rename', 'remove', 'clear', 'roll'];
export function projectList(result) {
    const { kind: _kind, ...projection } = result;
    return projection;
}
export function entriesOf(list) {
    const seen = new Set();
    const entries = [];
    for (const id of list.slots) {
        if (id === null || seen.has(id))
            continue;
        seen.add(id);
        entries.push({ id, name: list.entities[id]?.name ?? id, weight: weightOf(list, id) });
    }
    return entries;
}
export function emptyList() {
    return { slots: Array(SLOT_COUNT).fill(null), entities: {} };
}
export function emptyLists() {
    return { characters: emptyList(), threads: emptyList(), nextId: 1 };
}
/** Tolerant of a document saved before lists existed; strict on a present but malformed field. */
export function readLists(raw) {
    if (raw === undefined)
        return emptyLists();
    if (!isRecord(raw) || !Number.isInteger(raw.nextId) || !isList(raw.characters) || !isList(raw.threads)) {
        throw new Error('Mythic document lists are malformed.');
    }
    return { characters: raw.characters, threads: raw.threads, nextId: raw.nextId };
}
function isList(value) {
    return isRecord(value) && Array.isArray(value.slots) && value.slots.length === SLOT_COUNT
        && value.slots.every(slot => slot === null || typeof slot === 'string') && isRecord(value.entities);
}
export function resolveList(state, body, die) {
    const list = state.lists[body.list];
    const { action } = body;
    const done = (next, outcome, nextId = state.lists.nextId, draws = []) => ({
        result: { kind: 'list', list: body.list, outcome, entries: entriesOf(next) }, draws,
        state: { ...state, lists: { ...state.lists, [body.list]: next, nextId } },
    });
    switch (action.kind) {
        case 'add': {
            const name = cleanName(action.name);
            const open = list.slots.indexOf(null);
            if (open === -1)
                throw new Error(`${LIST_LABELS[body.list]} list is full (${SLOT_COUNT} slots).`);
            const id = `${body.list}-${state.lists.nextId}`;
            const slots = replaceSlot(list.slots, open, id);
            return done({ slots, entities: { ...list.entities, [id]: { name } } }, { kind: 'added', id, name, position: open + 1 }, state.lists.nextId + 1);
        }
        case 'weight': {
            const { id, name } = entity(list, body.list, action.id);
            const open = list.slots.indexOf(null);
            if (weightOf(list, id) >= MAX_COPIES)
                throw new Error(`${name} already has three copies.`);
            if (open === -1)
                throw new Error(`${LIST_LABELS[body.list]} list is full (${SLOT_COUNT} slots).`);
            const slots = replaceSlot(list.slots, open, id);
            return done({ ...list, slots }, { kind: 'weighted', id, name, weight: weightOf({ ...list, slots }, id) });
        }
        case 'unweight': {
            const { id, name } = entity(list, body.list, action.id);
            if (weightOf(list, id) <= 1)
                throw new Error(`${name} has only one copy; use remove instead.`);
            const slots = replaceSlot(list.slots, list.slots.lastIndexOf(id), null);
            return done({ ...list, slots }, { kind: 'unweighted', id, name, weight: weightOf({ ...list, slots }, id) });
        }
        case 'rename': {
            const { id, name } = entity(list, body.list, action.id);
            const to = cleanName(action.name);
            return done({ ...list, entities: { ...list.entities, [id]: { name: to } } }, { kind: 'renamed', id, from: name, to });
        }
        case 'remove': {
            const { id, name } = entity(list, body.list, action.id);
            const { [id]: _removed, ...entities } = list.entities;
            const slots = list.slots.map(slot => (slot === id ? null : slot));
            return done({ slots, entities }, { kind: 'removed', id, name, copies: weightOf(list, id) });
        }
        case 'clear':
            return done(emptyList(), { kind: 'cleared', entities: Object.keys(list.entities).length });
        case 'roll': {
            const roll = rollList(list, die);
            return done(list, roll, state.lists.nextId, roll.draws);
        }
        default: {
            const exhaustive = action;
            throw new Error(`Unknown list action: ${JSON.stringify(exhaustive)}`);
        }
    }
}
/**
 * Mythic GME 2e list selection, reusable by Random Events: choose uniformly among the groups that hold at least one
 * entry, then one of the group's five slots. The book rolls a d10 and halves it for the slot; the injected die is
 * asked for 5 sides directly so the recorded draw is already the slot. The group draw asks for as many sides as there
 * are non-empty groups and maps the result to the nth non-empty group.
 */
export function rollList(list, die) {
    const groups = Array.from({ length: GROUP_COUNT }, (_, index) => index + 1)
        .filter(group => list.slots.slice((group - 1) * GROUP_SIZE, group * GROUP_SIZE).some(slot => slot !== null));
    if (groups.length === 0)
        return { kind: 'current-context', draws: [] };
    const groupDraw = die(groups.length);
    const group = groups[groupDraw - 1];
    const slot = die(GROUP_SIZE);
    const draws = [groupDraw, slot];
    const id = list.slots[(group - 1) * GROUP_SIZE + (slot - 1)];
    if (id === null)
        return { kind: 'choose', group, slot, groups: groups.length, draws };
    return { kind: 'entity', id, name: list.entities[id].name, group, slot, groups: groups.length, draws };
}
function dice(roll) {
    return `d${roll.groups}=${roll.draws[0]}, d${GROUP_SIZE}=${roll.draws[1]}`;
}
function replaceSlot(slots, index, value) {
    return slots.map((slot, at) => (at === index ? value : slot));
}
export function weightOf(list, id) {
    return list.slots.filter(slot => slot === id).length;
}
function entity(list, kind, id) {
    const found = list.entities[id];
    if (!found)
        throw new Error(`No ${LIST_LABELS[kind]} entry with id ${id}.`);
    return { id, name: found.name };
}
function plural(count, one, many) {
    return `${count} ${count === 1 ? one : many}`;
}
function cleanName(raw) {
    const name = raw.trim();
    if (name === '')
        throw new Error('A list entry needs a name.');
    return name;
}
export function summarizeList(result) {
    const label = LIST_LABELS[result.list];
    const { outcome } = result;
    switch (outcome.kind) {
        case 'added': return `${label}: added ${outcome.name} (${outcome.id}).`;
        case 'weighted':
        case 'unweighted': return `${label}: ${outcome.name} weight x${outcome.weight}.`;
        case 'renamed': return `${label}: renamed ${outcome.from} to ${outcome.to}.`;
        case 'removed': return `${label}: removed ${outcome.name} (${plural(outcome.copies, 'copy', 'copies')}).`;
        case 'cleared': return `${label}: cleared ${plural(outcome.entities, 'entry', 'entries')}.`;
        case 'entity':
            return `${label} roll: ${outcome.name} (group ${outcome.group}, slot ${outcome.slot}; ${dice(outcome)}).`;
        case 'choose':
            return `${label} roll: Choose (group ${outcome.group}, slot ${outcome.slot} is blank; ${dice(outcome)}).`;
        case 'current-context': return `${label} roll: Current Context (the list is empty).`;
        default: {
            const exhaustive = outcome;
            throw new Error(`Unknown list outcome: ${JSON.stringify(exhaustive)}`);
        }
    }
}
