import { formatFace, formatModifier, keptFlags } from "../engine/dice.js";
import { cardShell, element } from "./card-shell.js";
/**
 * Each die in roll order (kept ones carry `is-kept`), then the modifier and total. The faces and total already say
 * everything the one-line summary says, so the summary is the card's accessible name rather than a repeated line.
 */
export function renderDiceCard(receipt) {
    const { result } = receipt;
    const faces = element('ul', 'mythic-gme-dice-faces');
    faces.setAttribute('aria-label', 'Dice rolled');
    const kept = keptFlags(result);
    result.draws.forEach((value, index) => {
        const die = element('li', `mythic-gme-die ${kept[index] ? 'is-kept' : 'is-dropped'}`, formatFace(result, value));
        if (!kept[index])
            die.setAttribute('aria-label', `${formatFace(result, value)}, dropped`);
        faces.append(die);
    });
    const total = element('p', 'mythic-gme-dice-total');
    if (result.modifier !== 0) {
        const modifier = element('span', 'mythic-gme-dice-modifier', formatModifier(result.modifier));
        modifier.setAttribute('data-modifier', '');
        total.append(modifier, ' ');
    }
    const sum = element('strong', '', String(result.total));
    sum.setAttribute('data-total', '');
    total.append('= ', sum);
    const card = cardShell(receipt, result.expression, faces, total);
    card.setAttribute('aria-label', receipt.summary);
    return card;
}
