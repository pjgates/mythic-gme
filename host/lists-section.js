import { LIST_KINDS, LIST_LABELS, MAX_COPIES, SLOT_COUNT, entriesOf, } from "../engine/lists.js";
import { cardShell, element } from "./card-shell.js";
import { isInteractive, latestReceipt } from "./section-helpers.js";
const ROLL_KINDS = new Set(['entity', 'choose', 'current-context']);
const isRoll = (result) => ROLL_KINDS.has(result.outcome.kind);
/**
 * One collapsible block per Adventure List with its entries, weights, add box, roll and two-tap clear, plus the
 * last list roll's card. Every control is a button or form field of at least 44px; nothing depends on hover.
 */
export function createListsSection(actions) {
    const element = document.createElement('section');
    element.className = 'mythic-gme-lists';
    element.setAttribute('aria-label', 'Adventure Lists');
    const blocks = new Map();
    for (const list of LIST_KINDS) {
        const block = createBlock(list, actions, () => render(lastState));
        blocks.set(list, block);
        element.append(block.details);
    }
    let lastState;
    function render(state) {
        if (!state)
            return;
        lastState = state;
        const document = state.document;
        const interactive = isInteractive(state);
        for (const [list, block] of blocks) {
            const listState = document?.lists[list];
            const entries = listState ? entriesOf(listState) : [];
            const full = listState ? !listState.slots.includes(null) : true;
            block.ui.revision = document?.revision;
            if (block.ui.confirmClearAt !== undefined && block.ui.confirmClearAt !== document?.revision)
                block.ui.confirmClearAt = undefined;
            if (block.ui.renaming && !entries.some(entry => entry.id === block.ui.renaming?.id))
                block.ui.renaming = undefined;
            block.count.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · ${listState ? usedSlots(listState) : 0}/${SLOT_COUNT} slots`;
            renderEntries(block, list, entries, interactive, full, actions, () => render(lastState));
            block.addInput.disabled = !interactive || full;
            block.addButton.disabled = !interactive || full;
            block.addInput.placeholder = full ? `${LIST_LABELS[list]} list is full` : `Add ${LIST_LABELS[list].toLowerCase()}, one per line`;
            block.roll.disabled = !interactive;
            block.clear.disabled = !interactive || entries.length === 0;
            block.clear.textContent = block.ui.confirmClearAt === undefined ? 'Clear' : 'Tap again to clear';
            block.clear.setAttribute('aria-pressed', String(block.ui.confirmClearAt !== undefined));
            renderLastRoll(block, latestReceipt(state, 'list', result => result.list === list && isRoll(result)));
        }
    }
    return { element, render };
}
function createBlock(list, actions, rerender) {
    const label = LIST_LABELS[list];
    const details = document.createElement('details');
    details.className = 'mythic-gme-panel mythic-gme-list';
    details.dataset.list = list;
    details.innerHTML = `<summary><span class="mythic-gme-list-title">${label}</span> <span class="mythic-gme-list-count" data-count></span></summary>
  <ul class="mythic-gme-list-entries" data-entries aria-label="${label} entries"></ul>
  <form class="mythic-gme-list-add" data-add>
    <textarea class="text_pole" name="name" rows="1" autocomplete="off" maxlength="3000" aria-label="New ${label} entries, one per line"
      data-add-input></textarea>
    <button class="menu_button" type="submit" data-add-button>Add</button>
  </form>
  <div class="mythic-gme-list-actions">
    <button class="menu_button" type="button" data-roll>Roll ${label}</button>
    <button class="menu_button mythic-gme-danger" type="button" data-clear aria-pressed="false">Clear</button>
  </div>
  <div class="mythic-gme-list-card" data-card aria-live="polite"></div>`;
    const query = (selector) => details.querySelector(selector);
    const block = {
        details,
        count: query('[data-count]'),
        entries: query('[data-entries]'),
        addInput: query('[data-add-input]'),
        addButton: query('[data-add-button]'),
        roll: query('[data-roll]'),
        clear: query('[data-clear]'),
        card: query('[data-card]'),
        ui: {},
    };
    // One name per line: a pasted cast or thread list becomes one recorded add per line, in order.
    query('[data-add]').addEventListener('submit', event => {
        event.preventDefault();
        const names = block.addInput.value.split('\n').map(line => line.trim()).filter(line => line !== '');
        if (names.length === 0)
            return;
        block.addInput.value = '';
        void addEach(list, names, actions);
    });
    block.addInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.shiftKey)
            return;
        event.preventDefault();
        query('[data-add]').requestSubmit();
    });
    block.roll.onclick = () => actions.list(list, { kind: 'roll' });
    block.clear.onclick = () => {
        if (block.ui.confirmClearAt === undefined) {
            block.ui.confirmClearAt = block.ui.revision ?? -1;
            rerender();
            return;
        }
        block.ui.confirmClearAt = undefined;
        actions.list(list, { kind: 'clear' });
    };
    return block;
}
async function addEach(list, names, actions) {
    for (const name of names)
        await actions.list(list, { kind: 'add', name });
}
function renderEntries(block, list, entries, interactive, full, actions, rerender) {
    block.entries.replaceChildren(...entries.map(entry => {
        const item = document.createElement('li');
        item.className = 'mythic-gme-list-entry';
        item.dataset.id = entry.id;
        const renaming = block.ui.renaming;
        if (renaming && renaming.id === entry.id) {
            item.append(renameForm(block, list, entry, renaming, interactive, actions, rerender));
            return item;
        }
        const name = document.createElement('span');
        name.className = 'mythic-gme-list-name';
        name.textContent = entry.name;
        const weight = document.createElement('span');
        weight.className = 'mythic-gme-list-weight';
        weight.textContent = `x${entry.weight}`;
        weight.setAttribute('aria-label', `weight ${entry.weight} of ${MAX_COPIES}`);
        const controls = document.createElement('div');
        controls.className = 'mythic-gme-list-controls';
        controls.append(button('+', `Add weight to ${entry.name}`, !interactive || full || entry.weight >= MAX_COPIES, () => actions.list(list, { kind: 'weight', id: entry.id })), button('−', `Remove weight from ${entry.name}`, !interactive || entry.weight <= 1, () => actions.list(list, { kind: 'unweight', id: entry.id })), button('Rename', `Rename ${entry.name}`, !interactive, () => { block.ui.renaming = { id: entry.id, draft: entry.name }; rerender(); }), button('Remove', `Remove ${entry.name}`, !interactive, () => actions.list(list, { kind: 'remove', id: entry.id })));
        item.append(name, weight, controls);
        return item;
    }));
}
function renameForm(block, list, entry, renaming, interactive, actions, rerender) {
    const form = document.createElement('form');
    form.className = 'mythic-gme-list-rename';
    const input = document.createElement('input');
    input.className = 'text_pole';
    input.type = 'text';
    input.value = renaming.draft;
    input.maxLength = 120;
    input.setAttribute('aria-label', `New name for ${entry.name}`);
    input.addEventListener('input', () => { renaming.draft = input.value; });
    const save = button('Save', `Save new name for ${entry.name}`, !interactive, () => { });
    save.type = 'submit';
    const cancel = button('Cancel', 'Cancel rename', false, () => { block.ui.renaming = undefined; rerender(); });
    form.addEventListener('submit', event => {
        event.preventDefault();
        const name = input.value.trim();
        block.ui.renaming = undefined;
        if (name === '' || name === entry.name) {
            rerender();
            return;
        }
        actions.list(list, { kind: 'rename', id: entry.id, name });
    });
    form.append(input, save, cancel);
    queueMicrotask(() => input.focus());
    return form;
}
function button(text, label, disabled, onclick) {
    const element = document.createElement('button');
    element.className = 'menu_button';
    element.type = 'button';
    element.textContent = text;
    element.setAttribute('aria-label', label);
    element.disabled = disabled;
    element.onclick = onclick;
    return element;
}
function usedSlots(list) {
    return list.slots.filter(slot => slot !== null).length;
}
function renderLastRoll(block, receipt) {
    if (block.ui.shownRoll === receipt?.operationId)
        return;
    block.ui.shownRoll = receipt?.operationId;
    block.card.replaceChildren(...(receipt ? [renderListCard(receipt)] : []));
}
/** The receipt card for any list operation; roll outcomes get a prominent target line above the summary. */
export function renderListCard(receipt) {
    const { list, outcome } = receipt.result;
    const label = LIST_LABELS[list];
    const body = [];
    if (outcome.kind === 'entity' || outcome.kind === 'choose' || outcome.kind === 'current-context') {
        body.push(element('p', 'mythic-gme-card-target', outcome.kind === 'entity' ? outcome.name : outcome.kind === 'choose' ? 'Choose' : 'Current Context'));
    }
    body.push(element('p', 'mythic-gme-card-summary', receipt.summary));
    if (receipt.draws.length)
        body.push(element('p', 'mythic-gme-card-dice', `Dice: ${receipt.draws.join(', ')}`));
    return cardShell(receipt, isRoll(receipt.result) ? `${label} roll` : `${label} list`, ...body);
}
