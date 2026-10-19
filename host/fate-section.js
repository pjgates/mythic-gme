import { NO_EXCEPTIONAL_NO, NO_EXCEPTIONAL_YES, oddsLabel } from "../engine/fate-chart.js";
import { fateOutcomeLabel } from "../engine/fate.js";
import { element, markCaller } from "./card-shell.js";
import { randomEventView, renderRandomEventBlock } from "./random-event-card.js";
function range(low, high) {
    if (low > high)
        return '—';
    return low === high ? String(low) : `${low}–${high}`;
}
/** The four bands a cell produces on a d100, using — for a band the chart makes impossible. */
export function thresholdBands(cell) {
    const exceptionalYes = cell.exceptionalYes === NO_EXCEPTIONAL_YES ? '—' : range(1, cell.exceptionalYes);
    const exceptionalNo = cell.exceptionalNo === NO_EXCEPTIONAL_NO ? '—' : range(cell.exceptionalNo, 100);
    const noHigh = Math.min(cell.exceptionalNo - 1, 100);
    return `Exceptional Yes ${exceptionalYes} · Yes ${range(cell.exceptionalYes + 1, cell.yes)} · No ${range(cell.yes + 1, noHigh)} · Exceptional No ${exceptionalNo}`;
}
function fateResultOf(receipt) {
    if (receipt.result.kind !== 'fate')
        throw new Error(`Not a Fate Check receipt: ${receipt.result.kind}.`);
    return receipt.result;
}
/** Everything the card shows, read from the saved receipt only. */
export function fateCardView(receipt) {
    const result = fateResultOf(receipt);
    const overridden = result.chaosUsed !== receipt.chaosFactor;
    const view = {
        outcome: fateOutcomeLabel(result.outcome),
        draw: String(result.draw),
        odds: oddsLabel(result.odds),
        chaos: overridden ? `Chaos ${result.chaosUsed} (override; saved ${receipt.chaosFactor})` : `Chaos ${result.chaosUsed}`,
        thresholds: thresholdBands(result.thresholds),
        question: result.question,
        summary: receipt.summary,
    };
    if (result.randomEvent)
        view.randomEvent = randomEventView(result.randomEvent);
    return view;
}
/** `actions` enables "Roll another Meaning pair" on an event; without it the card is read-only (roll log, agent audit). */
export function renderFateCard(receipt, actions) {
    const view = fateCardView(receipt);
    const { randomEvent } = fateResultOf(receipt);
    const card = element('article', 'mythic-gme-card mythic-gme-fate-card');
    card.setAttribute('data-kind', 'fate');
    card.setAttribute('data-operation', receipt.operationId);
    card.setAttribute('data-outcome', fateResultOf(receipt).outcome);
    card.setAttribute('aria-label', view.summary);
    const head = element('header', 'mythic-gme-card-head');
    head.append(element('strong', 'mythic-gme-fate-outcome', view.outcome), element('span', 'mythic-gme-fate-draw', `d100: ${view.draw}`));
    if (view.randomEvent)
        head.append(element('span', 'mythic-gme-badge', 'Random Event'));
    markCaller(card, head, receipt);
    card.append(head);
    if (view.question !== undefined)
        card.append(element('p', 'mythic-gme-fate-question', view.question));
    card.append(element('p', 'mythic-gme-fate-meta', `${view.odds} · ${view.chaos}`));
    card.append(element('p', 'mythic-gme-fate-thresholds', view.thresholds));
    if (randomEvent)
        card.append(renderRandomEventBlock(randomEvent, receipt.operationId, actions));
    return card;
}
