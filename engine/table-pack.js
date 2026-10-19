import { isRecord } from "./guards.js";
/**
 * Meaning Tables table pack: one JSON document, schema version 1. Every table holds exactly 100 entries where
 * index 0 is the d100 result 1. The repository ships only the schema, the validator and a non-infringing
 * fallback pack; the commercial Mythic word lists are never committed.
 */
export const TABLE_PACK_VERSION = 1;
export const TABLE_LENGTH = 100;
const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
/** Throws a message naming the offending table and entry precisely; a rejected pack never becomes active. */
export function validateTablePack(raw) {
    if (!isRecord(raw))
        throw new Error('Table pack must be a JSON object.');
    if (raw.version !== TABLE_PACK_VERSION) {
        throw new Error(`Unknown table pack version ${JSON.stringify(raw.version)}; expected ${TABLE_PACK_VERSION}.`);
    }
    if (!isNonEmptyString(raw.id))
        throw new Error('Table pack "id" must be a non-empty string.');
    if (!isNonEmptyString(raw.label))
        throw new Error('Table pack "label" must be a non-empty string.');
    const actions = isRecord(raw.actions) ? raw.actions : {};
    const descriptions = isRecord(raw.descriptions) ? raw.descriptions : {};
    const pack = {
        version: TABLE_PACK_VERSION, id: raw.id, label: raw.label,
        actions: { action1: wordTable('actions.action1', actions.action1), action2: wordTable('actions.action2', actions.action2) },
        descriptions: {
            description1: wordTable('descriptions.description1', descriptions.description1),
            description2: wordTable('descriptions.description2', descriptions.description2),
        },
        elements: {},
    };
    if (raw.elements !== undefined && !isRecord(raw.elements))
        throw new Error('Table pack "elements" must be an object of named tables.');
    for (const [name, table] of Object.entries(raw.elements ?? {})) {
        const id = `elements.${name}`;
        const source = isRecord(table) ? table : {};
        if (!isNonEmptyString(source.label))
            throw new Error(`Table "${id}" needs a non-empty label.`);
        pack.elements[name] = { label: source.label, entries: wordTable(id, source.entries) };
    }
    return pack;
}
function wordTable(id, raw) {
    if (raw === undefined)
        throw new Error(`Table "${id}" is missing.`);
    if (!Array.isArray(raw))
        throw new Error(`Table "${id}" must be an array of ${TABLE_LENGTH} strings.`);
    if (raw.length !== TABLE_LENGTH)
        throw new Error(`Table "${id}" has ${raw.length} entries; expected ${TABLE_LENGTH}.`);
    return raw.map((entry, index) => {
        if (!isNonEmptyString(entry))
            throw new Error(`Table "${id}" entry ${index + 1} is empty.`);
        return entry;
    });
}
export function tableIds(pack) {
    return [
        { id: 'actions', label: 'Actions' },
        { id: 'descriptions', label: 'Descriptions' },
        ...Object.entries(pack.elements).map(([name, table]) => ({ id: `elements.${name}`, label: table.label })),
    ];
}
