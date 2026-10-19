import { MAX_NOTE_LENGTH, noteFor, sceneEntries } from "../engine/note.js";
import { toReceipt } from "../engine/operation.js";
import { isRoll } from "../engine/prompt.js";
import { element } from "./card-shell.js";
import { renderCard } from "./cards.js";
import { isInteractive } from "./section-helpers.js";
/**
 * The open scene's rolls, newest first, each with its interpretation and the actions that move play on. Bookkeeping
 * (list edits, Chaos steps, toggles) stays in the roll log; notes are not entries of their own but ride under the
 * receipt they are about. Nodes are keyed by operationId and rebuilt only when the receipt's note changes, so an open
 * note editor survives unrelated re-renders.
 */
export function createFeedSection(actions) {
    const section = element('section', 'mythic-gme-feed');
    section.setAttribute('aria-label', 'This scene');
    const empty = element('p', 'mythic-gme-feed-empty', 'Nothing asked in this scene yet.');
    empty.dataset.feedEmpty = '';
    const list = element('div', 'mythic-gme-feed-entries');
    list.dataset.feedEntries = '';
    section.append(empty, list);
    const entries = new Map();
    let shownBinding;
    let shownKeys;
    function render(state) {
        const { document } = state;
        const interactive = isInteractive(state);
        if (state.binding !== shownBinding) {
            entries.clear();
            shownBinding = state.binding;
            shownKeys = undefined;
        }
        const receipts = document
            ? sceneEntries(document).filter(entry => isRoll(entry.result)).reverse().map(toReceipt)
            : [];
        const keyed = receipts.map(receipt => ({ receipt, note: document ? noteFor(document, receipt.operationId) : undefined }));
        const keys = keyed.map(({ receipt, note }) => `${receipt.operationId}:${note ?? ''}`).join('\n');
        if (keys !== shownKeys) {
            shownKeys = keys;
            const live = new Set(receipts.map(receipt => receipt.operationId));
            for (const id of [...entries.keys()])
                if (!live.has(id))
                    entries.delete(id);
            list.replaceChildren(...keyed.map(({ receipt, note }) => {
                const key = `${receipt.operationId}:${note ?? ''}`;
                const existing = entries.get(receipt.operationId);
                if (existing && existing.key === key)
                    return existing.node;
                const entry = createEntry(receipt, note, actions);
                entries.set(receipt.operationId, entry);
                return entry.node;
            }));
        }
        empty.hidden = receipts.length > 0 || !document;
        for (const entry of entries.values())
            entry.setInteractive(interactive);
    }
    return { element: section, render };
}
function createEntry(receipt, note, actions) {
    const node = element('article', 'mythic-gme-entry');
    node.dataset.entry = receipt.operationId;
    node.dataset.kind = receipt.result.kind;
    const card = renderCard(receipt, actions);
    node.append(card);
    if (note !== undefined) {
        const shown = element('p', 'mythic-gme-note', note);
        shown.dataset.note = '';
        node.append(shown);
    }
    const row = element('div', 'mythic-gme-entry-actions');
    const noteButton = element('button', 'menu_button mythic-gme-chip', note === undefined ? 'Note' : 'Edit note');
    noteButton.type = 'button';
    noteButton.dataset.noteToggle = '';
    noteButton.setAttribute('aria-expanded', 'false');
    row.append(noteButton);
    const toChat = actions.toChat;
    if (toChat) {
        const chatButton = element('button', 'menu_button mythic-gme-chip', 'To chat');
        chatButton.type = 'button';
        chatButton.dataset.toChat = '';
        chatButton.onclick = () => toChat(receipt, note);
        row.append(chatButton);
    }
    const form = element('form', 'mythic-gme-note-form');
    form.hidden = true;
    form.dataset.noteForm = '';
    const field = element('textarea', 'text_pole');
    field.rows = 2;
    field.maxLength = MAX_NOTE_LENGTH;
    field.value = note ?? '';
    field.placeholder = 'What this means in the story';
    field.setAttribute('aria-label', `Note on ${receipt.summary}`);
    const save = element('button', 'menu_button', 'Save note');
    save.type = 'submit';
    const cancel = element('button', 'menu_button', 'Cancel');
    cancel.type = 'button';
    const buttons = element('div', 'mythic-gme-note-buttons');
    buttons.append(save, cancel);
    form.append(field, buttons);
    node.append(row, form);
    const setOpen = (open) => {
        form.hidden = !open;
        noteButton.setAttribute('aria-expanded', String(open));
        if (open)
            queueMicrotask(() => field.focus());
    };
    noteButton.onclick = () => setOpen(form.hidden);
    cancel.onclick = () => { field.value = note ?? ''; setOpen(false); };
    form.addEventListener('submit', event => {
        event.preventDefault();
        const text = field.value.trim();
        if (text === (note ?? '')) {
            setOpen(false);
            return;
        }
        actions.note(receipt.operationId, text);
    });
    // "To chat" only reads the saved receipt, so it stays usable while a save is in flight.
    const controls = [noteButton, save, field, ...node.querySelectorAll('[data-meaning-again]')];
    return {
        node,
        key: `${receipt.operationId}:${note ?? ''}`,
        setInteractive(interactive) { for (const control of controls)
            control.disabled = !interactive; },
    };
}
