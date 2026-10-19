import { MAX_NOTE_LENGTH, SCENE_NOTE, expectedScene, sceneEntries } from "../engine/note.js";
import { SCENE_CONTROLS, sceneOutcomeLabel } from "../engine/scene.js";
import { cardShell, element, markCaller } from "./card-shell.js";
import { renderRandomEventBlock } from "./random-event-card.js";
import { isInteractive } from "./section-helpers.js";
function sceneResultOf(receipt) {
    if (receipt.result.kind !== 'scene-check')
        throw new Error(`Not a Scene Check receipt: ${receipt.result.kind}.`);
    return receipt.result;
}
/**
 * Expected shows the draw alone; Altered lists the kept adjustment(s) with their d10s; Interrupt renders the same
 * Random Event chain as the Fate card. `actions` enables "Roll another Meaning pair"; without it the card is read-only.
 */
export function renderSceneCard(receipt, actions) {
    const result = sceneResultOf(receipt);
    const card = element('article', 'mythic-gme-card mythic-gme-scene-card');
    card.setAttribute('data-kind', 'scene-check');
    card.setAttribute('data-operation', receipt.operationId);
    card.setAttribute('data-outcome', result.outcome);
    card.setAttribute('aria-label', receipt.summary);
    const head = element('header', 'mythic-gme-card-head');
    head.append(element('strong', 'mythic-gme-scene-outcome', `${sceneOutcomeLabel(result.outcome)} Scene`), element('span', 'mythic-gme-scene-draw', `d10: ${result.draw}`));
    if (result.randomEvent)
        head.append(element('span', 'mythic-gme-badge', 'Random Event'));
    markCaller(card, head, receipt);
    card.append(head, element('p', 'mythic-gme-scene-meta', `Chaos ${result.chaosFactor}`));
    if (result.adjustments) {
        const list = element('ul', 'mythic-gme-scene-adjustments');
        list.setAttribute('data-adjustments', '');
        list.setAttribute('aria-label', 'Scene Adjustment');
        for (const adjustment of result.adjustments) {
            const item = element('li', 'mythic-gme-scene-adjustment', `${adjustment.label} (d10: ${adjustment.draw})`);
            item.setAttribute('data-adjustment', adjustment.id);
            list.append(item);
        }
        card.append(list);
    }
    if (result.randomEvent)
        card.append(renderRandomEventBlock(result.randomEvent, receipt.operationId, actions));
    return card;
}
export function renderEndSceneCard(receipt) {
    return cardShell(receipt, 'End scene', element('p', 'mythic-gme-card-summary', receipt.summary));
}
/** One line for the strip: how the open scene's latest Scene Check came out. */
export function sceneStatusLine(result) {
    if (!result)
        return 'Scene Check: not rolled yet.';
    const head = `Scene Check: ${sceneOutcomeLabel(result.outcome)} (d10 ${result.draw})`;
    switch (result.outcome) {
        case 'expected': return `${head}.`;
        case 'altered': return `${head} — ${(result.adjustments ?? []).map(adjustment => adjustment.label).join(' and ')}.`;
        case 'interrupt': {
            const event = result.randomEvent;
            return event ? `${head} — ${event.focus.label}: ${event.meaning.words[0]} / ${event.meaning.words[1]}.` : `${head}.`;
        }
        default: {
            const exhaustive = result.outcome;
            throw new Error(`Unknown scene outcome: ${String(exhaustive)}`);
        }
    }
}
function latestSceneCheck(state) {
    const { document } = state;
    if (!document)
        return undefined;
    for (const entry of sceneEntries(document).reverse())
        if (entry.result.kind === 'scene-check')
            return entry.result;
    return undefined;
}
/**
 * The scene strip: the expected-scene line the player writes before the check (editable in place), the outcome of
 * this scene's latest Scene Check, then Scene Check and the two End scene verdicts. The receipts themselves live in
 * the feed below; the strip only says where the scene stands.
 */
export function createSceneSection(actions) {
    const section = element('section', 'mythic-gme-scene');
    section.setAttribute('aria-label', 'Scene');
    const view = element('div', 'mythic-gme-expected');
    const expected = element('p', 'mythic-gme-expected-text');
    expected.dataset.expected = '';
    const edit = element('button', 'menu_button mythic-gme-chip', 'Expected scene');
    edit.type = 'button';
    edit.dataset.expectedEdit = '';
    view.append(expected, edit);
    const form = element('form', 'mythic-gme-expected-form');
    form.hidden = true;
    form.dataset.expectedForm = '';
    const field = element('textarea', 'text_pole');
    field.rows = 2;
    field.maxLength = MAX_NOTE_LENGTH;
    field.dataset.expectedInput = '';
    field.placeholder = 'What do you expect this scene to be?';
    field.setAttribute('aria-label', 'Expected scene');
    const save = element('button', 'menu_button', 'Save');
    save.type = 'submit';
    const cancel = element('button', 'menu_button', 'Cancel');
    cancel.type = 'button';
    cancel.dataset.expectedCancel = '';
    const formButtons = element('div', 'mythic-gme-note-buttons');
    formButtons.append(save, cancel);
    form.append(field, formButtons);
    const status = element('p', 'mythic-gme-scene-status');
    status.dataset.sceneStatus = '';
    const row = element('div', 'mythic-gme-scene-row');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Scene Check and End scene');
    const check = element('button', 'menu_button mythic-gme-scene-check', 'Scene Check');
    check.type = 'button';
    check.dataset.sceneCheck = '';
    check.onclick = () => actions.scene({});
    const endLabel = element('span', 'mythic-gme-scene-end-label', 'End scene');
    const verdictButtons = SCENE_CONTROLS.map(control => {
        const button = element('button', 'menu_button', control === 'in' ? 'In control' : 'Out of control');
        button.type = 'button';
        button.dataset.endScene = control;
        button.setAttribute('aria-label', control === 'in' ? 'End scene in control' : 'End scene out of control');
        button.onclick = () => actions.endScene(control);
        return button;
    });
    row.append(check, endLabel, ...verdictButtons);
    section.append(view, form, status, row);
    const buttons = [check, ...verdictButtons, edit, save];
    let current;
    const setOpen = (open) => {
        form.hidden = !open;
        view.hidden = open;
        edit.setAttribute('aria-expanded', String(open));
        if (open) {
            field.value = current ?? '';
            queueMicrotask(() => field.focus());
        }
    };
    edit.onclick = () => setOpen(true);
    cancel.onclick = () => setOpen(false);
    form.addEventListener('submit', event => {
        event.preventDefault();
        const text = field.value.trim();
        setOpen(false);
        if (text !== (current ?? ''))
            actions.note(SCENE_NOTE, text);
    });
    function render(state) {
        const interactive = isInteractive(state);
        for (const button of buttons)
            button.disabled = !interactive;
        field.disabled = !interactive;
        current = state.document ? expectedScene(state.document) : undefined;
        expected.textContent = current ?? '';
        expected.hidden = current === undefined;
        edit.textContent = current === undefined ? 'Expected scene' : 'Edit';
        edit.setAttribute('aria-label', current === undefined ? 'Write the expected scene' : 'Edit the expected scene');
        status.textContent = sceneStatusLine(latestSceneCheck(state));
    }
    return { element: section, render };
}
