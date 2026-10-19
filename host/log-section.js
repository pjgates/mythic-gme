import { visibleLog } from "../engine/log.js";
import { SCENE_NOTE } from "../engine/note.js";
import { cardShell, element, markCaller } from "./card-shell.js";
import { renderCard } from "./cards.js";
import { isInteractive } from "./section-helpers.js";
/**
 * Collapsible roll log: the chat's visible receipts newest first, each collapsed to its one-line summary and
 * expandable to the full card, plus a two-tap Clear. Entry nodes are keyed by operationId so a re-render of the same
 * document reuses them and keeps whatever the player has expanded.
 */
export function createLogSection(actions) {
    const section = element('details', 'mythic-gme-panel mythic-gme-log');
    const heading = element('summary', 'mythic-gme-log-summary');
    const count = element('span', 'mythic-gme-log-count');
    count.dataset.count = '';
    heading.append(element('span', 'mythic-gme-log-title', 'Roll log'), ' ', count);
    const controls = element('div', 'mythic-gme-log-actions');
    const clear = element('button', 'menu_button mythic-gme-chip mythic-gme-danger', 'Clear');
    clear.type = 'button';
    clear.dataset.clear = '';
    clear.setAttribute('aria-pressed', 'false');
    const cancel = element('button', 'menu_button mythic-gme-chip', 'Cancel');
    cancel.type = 'button';
    cancel.dataset.cancel = '';
    cancel.hidden = true;
    cancel.setAttribute('aria-label', 'Cancel clearing the roll log');
    controls.append(clear, cancel);
    const entries = element('div', 'mythic-gme-log-entries');
    entries.setAttribute('aria-label', 'Roll log entries');
    section.append(heading, controls, entries);
    const nodes = new Map();
    let shownBinding;
    let shownIds;
    // Transient UI state: the revision Clear was armed at, so any recorded change disarms it.
    let confirmAt;
    let lastState;
    function render(state) {
        lastState = state;
        const { document } = state;
        const interactive = isInteractive(state);
        const log = document ? visibleLog(document) : [];
        if (state.binding !== shownBinding) {
            nodes.clear();
            shownBinding = state.binding;
            shownIds = undefined;
        }
        const ids = log.map(receipt => receipt.operationId).join('\n');
        if (ids !== shownIds) {
            shownIds = ids;
            const visible = new Set(log.map(receipt => receipt.operationId));
            for (const id of [...nodes.keys()])
                if (!visible.has(id))
                    nodes.delete(id);
            entries.replaceChildren(...log.map(receipt => nodes.get(receipt.operationId) ?? createEntry(receipt, nodes)));
        }
        count.textContent = `${log.length} ${log.length === 1 ? 'entry' : 'entries'}`;
        if (confirmAt !== undefined && confirmAt !== document?.revision)
            confirmAt = undefined;
        const armed = confirmAt !== undefined;
        clear.disabled = !interactive || !log.some(receipt => receipt.result.kind !== 'clear-log');
        clear.textContent = armed ? 'Confirm clear' : 'Clear';
        clear.setAttribute('aria-pressed', String(armed));
        cancel.hidden = !armed;
    }
    const rerender = () => { if (lastState)
        render(lastState); };
    clear.onclick = () => {
        if (confirmAt === undefined) {
            confirmAt = lastState?.document?.revision ?? -1;
            rerender();
            return;
        }
        confirmAt = undefined;
        actions.clearLog();
        rerender();
    };
    cancel.onclick = () => { confirmAt = undefined; rerender(); };
    return { element: section, render };
}
/** One collapsed entry; the full card is built from the saved receipt the first time the entry is opened. */
function createEntry(receipt, nodes) {
    const details = element('details', 'mythic-gme-log-entry');
    details.dataset.operationId = receipt.operationId;
    details.dataset.kind = receipt.result.kind;
    const summary = element('summary', 'mythic-gme-log-line');
    const when = document.createElement('time');
    when.dateTime = receipt.at;
    when.textContent = new Date(receipt.at).toLocaleTimeString();
    summary.append(element('span', 'mythic-gme-log-kind', kindLabel(receipt.result)), ' ', element('span', 'mythic-gme-log-text', lineText(receipt.result, receipt.summary)), ' ');
    markCaller(details, summary, receipt);
    summary.append(when);
    const card = element('div', 'mythic-gme-log-card');
    details.append(summary, card);
    details.addEventListener('toggle', () => {
        if (details.open && card.children.length === 0)
            card.append(renderCard(receipt));
    });
    nodes.set(receipt.operationId, details);
    return details;
}
function kindLabel(result) {
    switch (result.kind) {
        case 'adjust-chaos': return 'Chaos';
        case 'dice': return 'Dice';
        case 'fate': return 'Fate';
        case 'meaning': return 'Meaning';
        case 'list': return 'List';
        case 'clear-log': return 'Log';
        case 'scene-check': return 'Scene';
        case 'end-scene': return 'End scene';
        case 'set-prompt-injection': return 'Prompt';
        case 'acknowledge': return 'Acknowledged';
        case 'note': return result.about === SCENE_NOTE ? 'Expected scene' : 'Note';
        default: {
            const exhaustive = result;
            throw new Error(`Unknown result kind: ${String(exhaustive)}`);
        }
    }
}
/** The kind label already names a note's subject, so its line is the text itself rather than the "Note: …" summary. */
function lineText(result, summary) {
    if (result.kind !== 'note')
        return summary;
    return result.text === '' ? 'Cleared.' : result.text;
}
export function renderClearLogCard(receipt) {
    return cardShell(receipt, 'Roll log', element('p', 'mythic-gme-card-summary', receipt.summary));
}
