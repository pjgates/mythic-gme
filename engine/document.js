import { STARTING_CHAOS_FACTOR } from "./chaos.js";
import { isRecord } from "./guards.js";
import { emptyLists, readLists } from "./lists.js";
export const SCHEMA = 1;
export function newDocument(binding) {
    return { schema: SCHEMA, binding, revision: 0, chaosFactor: STARTING_CHAOS_FACTOR, sceneCount: 1, journal: [],
        lists: emptyLists(), promptInjection: false };
}
/** Strict on schema version; tolerant of fields added after a document was saved (missing lists and toggle get their defaults). */
export function readDocument(raw, binding) {
    if (!isRecord(raw) || raw.schema !== SCHEMA)
        throw new Error('Unknown Mythic document schema.');
    if (raw.binding !== binding)
        throw new Error('Mythic document belongs to another chat.');
    const { revision, chaosFactor, sceneCount, journal } = raw;
    if (!Number.isInteger(revision) || !Number.isInteger(chaosFactor) || !Number.isInteger(sceneCount) || !Array.isArray(journal)) {
        throw new Error('Mythic document is malformed.');
    }
    return { ...raw, schema: SCHEMA, binding, revision: revision, chaosFactor: chaosFactor,
        sceneCount: sceneCount, journal: journal, lists: readLists(raw.lists),
        promptInjection: raw.promptInjection === true };
}
