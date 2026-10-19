/** A note is bookkeeping about the open scene itself ("what I expect to happen"). */
export const SCENE_NOTE = 'scene';
export const MAX_NOTE_LENGTH = 2000;
export function resolveNote(state, body) {
    const about = typeof body.about === 'string' ? body.about.trim() : '';
    if (about === '')
        throw new Error('A note needs the operationId it is about, or "scene".');
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (text.length > MAX_NOTE_LENGTH)
        throw new Error(`A note is at most ${MAX_NOTE_LENGTH} characters.`);
    if (about !== SCENE_NOTE && !state.journal.some(entry => entry.operationId === about)) {
        throw new Error(`No receipt ${about} in this chat to note.`);
    }
    return { result: { kind: 'note', about, text }, draws: [], state };
}
export function summarizeNote(result) {
    const subject = result.about === SCENE_NOTE ? 'Expected scene' : 'Note';
    return result.text === '' ? `${subject} cleared.` : `${subject}: ${result.text}`;
}
/** Entries of the open scene: everything after the latest end-scene, oldest first (a clear-log hides what came before). */
export function sceneEntries(document) {
    const entries = [];
    for (let index = document.journal.length - 1; index >= 0; index--) {
        const entry = document.journal[index];
        if (entry.result.kind === 'end-scene')
            break;
        if (entry.result.kind === 'clear-log')
            break;
        entries.push(entry);
    }
    return entries.reverse();
}
/** The latest note text about `about` within `entries`, or undefined when there is none or it was cleared. */
export function noteIn(entries, about) {
    for (let index = entries.length - 1; index >= 0; index--) {
        const { result } = entries[index];
        if (result.kind === 'note' && result.about === about)
            return result.text === '' ? undefined : result.text;
    }
    return undefined;
}
/** The latest note about a receipt anywhere in the chat; notes about receipts outlive scene boundaries. */
export function noteFor(document, operationId) {
    return noteIn(document.journal, operationId);
}
/** The expected-scene line of the open scene; an end-scene starts the next scene with none. */
export function expectedScene(document) {
    return noteIn(sceneEntries(document), SCENE_NOTE);
}
