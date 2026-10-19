import { toReceipt } from "../engine/operation.js";
/** Controls act only on an open chat that is neither saving nor marked unavailable. */
export function isInteractive(state) {
    return state.available && !state.busy && !!state.document;
}
/**
 * The newest receipt of the given kind(s) in the open chat's journal, built from the saved record; `matches` narrows
 * further on the typed result (a particular list, a roll outcome). A list block shows its last roll this way.
 */
export function latestReceipt(state, kind, matches = () => true) {
    const journal = state.document?.journal;
    if (!journal)
        return undefined;
    const kinds = Array.isArray(kind) ? kind : [kind];
    for (let index = journal.length - 1; index >= 0; index--) {
        const { result } = journal[index];
        if (kinds.some(candidate => candidate === result.kind) && matches(result)) {
            return toReceipt(journal[index]);
        }
    }
    return undefined;
}
