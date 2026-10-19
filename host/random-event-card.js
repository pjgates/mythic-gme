import { GROUP_SIZE, LIST_LABELS } from "../engine/lists.js";
import { parseMeaningTableId } from "../engine/meaning.js";
import { element } from "./card-shell.js";
function selectionLine(selection) {
    const label = LIST_LABELS[selection.list];
    switch (selection.kind) {
        case 'entity':
            return `${label}: ${selection.name} (group ${selection.group}, slot ${selection.slot}; d${selection.groups}=${selection.draws[0]}, d${GROUP_SIZE}=${selection.draws[1]})`;
        case 'choose':
            return `${label}: Choose (group ${selection.group}, slot ${selection.slot} is blank; d${selection.groups}=${selection.draws[0]}, d${GROUP_SIZE}=${selection.draws[1]})`;
        case 'current-context':
            return `${label}: Current Context (the list is empty)`;
        default: {
            const exhaustive = selection;
            throw new Error(`Unknown list roll: ${JSON.stringify(exhaustive)}`);
        }
    }
}
/** Everything the event block shows, read from the saved event only. */
export function randomEventView(event) {
    const table = parseMeaningTableId(event.meaning.table);
    if (!table)
        throw new Error(`Recorded Meaning table id "${event.meaning.table}" is not recognised.`);
    const view = {
        focus: `Focus: ${event.focus.label} (d100: ${event.focus.draw})`,
        words: `${event.meaning.words[0]} / ${event.meaning.words[1]}`,
        meaning: `${event.meaning.tableLabel} · d100: ${event.meaning.draws[0]}, ${event.meaning.draws[1]} · pack: ${event.meaning.packId}`,
        table,
    };
    if (event.selection)
        view.selection = selectionLine(event.selection);
    return view;
}
/**
 * Stacked single-column blocks so a phone-width drawer never scrolls sideways. The re-roll button appears only
 * when a caller can act on it (the drawer section); a bare card render, e.g. a roll log, shows the chain alone.
 */
export function renderRandomEventBlock(event, operationId, actions) {
    const view = randomEventView(event);
    const block = element('section', 'mythic-gme-event');
    block.setAttribute('data-random-event', '');
    block.setAttribute('aria-label', 'Random Event');
    const focus = element('p', 'mythic-gme-event-focus', view.focus);
    focus.setAttribute('data-focus', '');
    block.append(focus);
    if (view.selection !== undefined) {
        const selection = element('p', 'mythic-gme-event-selection', view.selection);
        selection.setAttribute('data-selection', '');
        block.append(selection);
    }
    const words = element('p', 'mythic-gme-event-words', view.words);
    words.setAttribute('data-words', '');
    const meaning = element('p', 'mythic-gme-event-meta', view.meaning);
    meaning.setAttribute('data-meaning', '');
    block.append(words, meaning);
    if (actions) {
        const again = element('button', 'menu_button mythic-gme-event-again', 'Roll another Meaning pair');
        again.type = 'button';
        again.setAttribute('data-meaning-again', '');
        again.onclick = () => actions.meaningFor(operationId, view.table);
        block.append(again);
    }
    return block;
}
