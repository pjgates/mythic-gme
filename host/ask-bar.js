import { parseDice } from "../engine/dice.js";
import { ODDS } from "../engine/fate-chart.js";
import { LIST_KINDS, LIST_LABELS } from "../engine/lists.js";
import { parseMeaningTableId } from "../engine/meaning.js";
import { tableIds } from "../engine/table-pack.js";
import { element } from "./card-shell.js";
import { isInteractive } from "./section-helpers.js";
const INPUT_ID = 'mythic-gme-ask';
const PLACEHOLDER = 'Ask a question, type dice, or name a character';
export function isDiceExpression(text) {
    try {
        parseDice(text);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * One field whose verbs are chips: the text is the question an odds chip asks, the dice Roll rolls, or the name
 * "+ Character" adds. Nothing is read back from the DOM except the field itself at the moment of the tap.
 */
export function createAskBar(actions, options = {}) {
    const bar = element('div', 'mythic-gme-ask');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Ask');
    const form = element('form', 'mythic-gme-ask-form');
    const label = element('label', 'mythic-gme-sr', 'Ask');
    label.htmlFor = INPUT_ID;
    const input = element('input', 'text_pole');
    input.id = INPUT_ID;
    input.type = 'text';
    input.placeholder = PLACEHOLDER;
    input.dataset.ask = '';
    input.autocomplete = 'off';
    input.autocapitalize = 'sentences';
    input.enterKeyHint = 'done';
    input.maxLength = 500;
    const roll = element('button', 'menu_button mythic-gme-roll', 'Roll');
    roll.type = 'submit';
    roll.dataset.roll = '';
    roll.hidden = true;
    form.append(label, input, roll);
    const hint = element('p', 'mythic-gme-ask-hint');
    hint.dataset.askHint = '';
    hint.hidden = true;
    hint.setAttribute('aria-live', 'polite');
    const chips = element('div', 'mythic-gme-chips');
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', 'Ask with');
    const oddsGroup = group('Odds');
    const oddsButtons = ODDS.map(entry => {
        const chip = element('button', 'menu_button mythic-gme-chip', entry.label);
        chip.type = 'button';
        chip.dataset.odds = entry.id;
        chip.onclick = () => {
            if (holdsDice())
                return;
            const request = { odds: entry.id };
            const asked = input.value.trim();
            if (asked !== '')
                request.question = asked;
            const override = options.chaosOverride?.();
            if (override !== undefined)
                request.chaosOverride = override;
            actions.fate(request);
            clear();
        };
        oddsGroup.append(chip);
        return chip;
    });
    const fifty = oddsButtons.find(chip => chip.dataset.odds === 'fifty-fifty');
    const meaningGroup = group('Meaning Tables');
    meaningGroup.dataset.meaningChips = '';
    const listGroup = group('Adventure Lists');
    const addButtons = LIST_KINDS.map(list => {
        const chip = element('button', 'menu_button mythic-gme-chip', `+ ${LIST_LABELS[list].replace(/s$/, '')}`);
        chip.type = 'button';
        chip.dataset.add = list;
        chip.onclick = () => {
            if (holdsDice())
                return;
            const name = input.value.trim();
            if (name === '') {
                say(`Type the name first, then tap + ${LIST_LABELS[list].replace(/s$/, '')}.`);
                input.focus();
                return;
            }
            actions.add(list, name);
            clear();
        };
        listGroup.append(chip);
        return chip;
    });
    chips.append(oddsGroup, meaningGroup, listGroup);
    bar.append(form, hint, chips);
    function say(text) { hint.textContent = text; hint.hidden = text === ''; }
    function clear() { input.value = ''; reflect(); }
    // While the field holds dice the Roll button is the verb; the other chips decline rather than ask or add "2d6+1".
    function holdsDice() {
        if (!isDiceExpression(input.value.trim()))
            return false;
        say('That is a dice expression: tap Roll, or type a question or a name.');
        input.focus();
        return true;
    }
    function reflect() {
        const dice = isDiceExpression(input.value);
        roll.hidden = !dice;
        input.enterKeyHint = dice ? 'go' : 'done';
        if (!hint.hidden)
            say('');
    }
    input.addEventListener('input', reflect);
    form.addEventListener('submit', event => {
        event.preventDefault();
        const text = input.value.trim();
        if (isDiceExpression(text)) {
            actions.roll(text);
            return;
        }
        // Enter on a question is "done": the keyboard goes away and the odds chips are the next tap.
        input.blur();
    });
    let meaningIds = '';
    let meaningButtons = [];
    function render(state, pack) {
        const interactive = isInteractive(state);
        const tables = tableIds(pack).flatMap(entry => {
            const table = parseMeaningTableId(entry.id);
            return table ? [{ id: entry.id, label: entry.label, table }] : [];
        });
        const ids = tables.map(table => table.id).join('\n');
        if (ids !== meaningIds) {
            meaningIds = ids;
            meaningButtons = tables.map(({ id, label, table }) => {
                const chip = element('button', 'menu_button mythic-gme-chip', label);
                chip.type = 'button';
                chip.dataset.table = id;
                chip.onclick = () => {
                    if (holdsDice())
                        return;
                    const asked = input.value.trim();
                    actions.meaning(table, asked === '' ? undefined : asked);
                    clear();
                };
                return chip;
            });
            meaningGroup.replaceChildren(...meaningButtons);
        }
        input.disabled = !interactive;
        roll.disabled = !interactive;
        for (const chip of [...oddsButtons, ...meaningButtons, ...addButtons])
            chip.disabled = !interactive;
    }
    function settle() {
        if (!fifty || typeof chips.scrollTo !== 'function')
            return;
        chips.scrollTo({ left: Math.max(0, fifty.offsetLeft - (chips.clientWidth - fifty.offsetWidth) / 2) });
    }
    return { element: bar, render, settle, focus: () => input.focus() };
}
function group(name) {
    const node = element('div', 'mythic-gme-chip-group');
    node.setAttribute('role', 'group');
    node.setAttribute('aria-label', name);
    return node;
}
