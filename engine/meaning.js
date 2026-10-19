import { TABLE_LENGTH } from "./table-pack.js";
export function meaningTableId(table) {
    return typeof table === 'string' ? table : `elements.${table.elements}`;
}
/** Parses a table id from the UI or slash command; unknown Elements names are left for the engine to refuse. */
export function parseMeaningTableId(id) {
    if (id === 'actions' || id === 'descriptions')
        return id;
    if (id.startsWith('elements.') && id.length > 'elements.'.length)
        return { elements: id.slice('elements.'.length) };
    return undefined;
}
/** Actions and Descriptions draw once on each of their two tables; an Elements pair draws twice on one table. */
export function resolveMeaning(state, body, die, pack) {
    const [first, second, tableLabel] = pairFor(body.table, pack);
    const draws = [die(TABLE_LENGTH), die(TABLE_LENGTH)];
    const result = {
        kind: 'meaning', table: meaningTableId(body.table), tableLabel, packId: pack.id, packLabel: pack.label,
        draws, words: [first[draws[0] - 1], second[draws[1] - 1]],
    };
    if (body.parentOperationId !== undefined)
        result.parentOperationId = body.parentOperationId;
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (question !== '')
        result.question = question;
    return { result, draws: [...draws], state };
}
/** Refuses a table the pack does not hold; callers that chain a Meaning pair use it before their own first draw. */
export function assertMeaningTable(table, pack) {
    pairFor(table, pack);
}
function pairFor(table, pack) {
    if (table === 'actions')
        return [pack.actions.action1, pack.actions.action2, 'Actions'];
    if (table === 'descriptions')
        return [pack.descriptions.description1, pack.descriptions.description2, 'Descriptions'];
    const elements = Object.hasOwn(pack.elements, table.elements) ? pack.elements[table.elements] : undefined;
    if (!elements)
        throw new Error(`Unknown Meaning table "${meaningTableId(table)}" in pack "${pack.label}".`);
    return [elements.entries, elements.entries, elements.label];
}
export function summarizeMeaning(result) {
    return `Meaning (${result.tableLabel}): ${result.words[0]} / ${result.words[1]} [${result.draws[0]}, ${result.draws[1]}]`
        + ` — pack: ${shortPackLabel(result.packLabel)}${result.question === undefined ? '' : ` "${result.question}"`}`;
}
export function projectMeaning(result) {
    const projection = { table: result.table, packId: result.packId, draws: result.draws, words: result.words };
    if (result.parentOperationId !== undefined)
        projection.parentOperationId = result.parentOperationId;
    if (result.question !== undefined)
        projection.question = result.question;
    return projection;
}
/** The one-line summary drops a parenthetical note from the pack label, e.g. "Fallback (non-infringing placeholder)". */
function shortPackLabel(label) {
    const note = label.indexOf(' (');
    return note > 0 ? label.slice(0, note) : label;
}
