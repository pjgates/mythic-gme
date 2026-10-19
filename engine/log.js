import { toReceipt } from "./operation.js";
/**
 * Clearing hides what came before; it never deletes journal entries. The journal stays the idempotency source of
 * truth (a repeated operationId still finds its recorded result), while `visibleLog` starts at the latest clear.
 * Chaos Factor, scene count and the Adventure Lists are untouched.
 */
export function resolveClearLog(state, _body, _die) {
    return { result: { kind: 'clear-log' }, draws: [], state };
}
export function summarizeClearLog(_result) {
    return 'Roll log cleared.';
}
/** The roll log as the player reads it: receipts newest first, down to and including the latest clear receipt. */
export function visibleLog(document) {
    return visibleEntries(document.journal).map(toReceipt);
}
function visibleEntries(journal) {
    const entries = [];
    for (let index = journal.length - 1; index >= 0; index--) {
        const entry = journal[index];
        entries.push(entry);
        if (entry.result.kind === 'clear-log')
            break;
    }
    return entries;
}
