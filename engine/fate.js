import { CHAOS_MAX, CHAOS_MIN, isChaosFactor } from "./chaos.js";
import { fateChartCell, isOddsId, oddsLabel } from "./fate-chart.js";
import { assertMeaningTable } from "./meaning.js";
import { resolveRandomEvent } from "./random-event.js";
export function projectFate(result) {
    const { kind: _kind, randomEvent, ...rest } = result;
    return { ...rest, randomEvent: randomEvent !== undefined, ...(randomEvent ? { event: randomEvent } : {}) };
}
const OUTCOME_LABELS = {
    'exceptional-yes': 'Exceptional Yes',
    yes: 'Yes',
    no: 'No',
    'exceptional-no': 'Exceptional No',
};
export function fateOutcomeLabel(outcome) {
    return OUTCOME_LABELS[outcome];
}
export function fateOutcome(draw, cell) {
    if (draw <= cell.exceptionalYes)
        return 'exceptional-yes';
    if (draw <= cell.yes)
        return 'yes';
    if (draw >= cell.exceptionalNo)
        return 'exceptional-no';
    return 'no';
}
/** Doubles 11–99 whose single digit is at or below the Chaos Factor; 100 is never doubles. */
export function isRandomEvent(draw, chaos) {
    return draw < 100 && draw % 11 === 0 && draw / 11 <= chaos;
}
/**
 * One d100 draw against the Fate Chart. Validation happens before the draw so a refused body rolls nothing.
 * A Chaos override only changes the row used for this check; the saved Chaos Factor is returned untouched.
 * A draw that triggers a Random Event resolves it here too, so one recorded operation carries fate and event
 * with every draw in order: fate d100, Focus d100, list roll (group, slot) when the focus names a list, Meaning pair.
 */
export function resolveFate(state, body, die, pack) {
    if (!isOddsId(body.odds))
        throw new Error(`Unknown odds "${String(body.odds)}".`);
    const override = body.chaosOverride;
    if (override !== undefined && !isChaosFactor(override)) {
        throw new Error(`Chaos override must be a whole number from ${CHAOS_MIN} to ${CHAOS_MAX}, got ${String(override)}.`);
    }
    if (body.eventMeaning !== undefined)
        assertMeaningTable(body.eventMeaning, pack);
    const chaosUsed = override ?? state.chaosFactor;
    const thresholds = fateChartCell(body.odds, chaosUsed);
    const draw = die(100);
    const result = { kind: 'fate', draw, odds: body.odds, chaosUsed, thresholds, outcome: fateOutcome(draw, thresholds) };
    const draws = [draw];
    if (isRandomEvent(draw, chaosUsed)) {
        const { draws: eventDraws, ...randomEvent } = resolveRandomEvent(state, die, pack, body.eventMeaning);
        result.randomEvent = randomEvent;
        draws.push(...eventDraws);
    }
    if (body.question !== undefined)
        result.question = body.question;
    return { result, draws, state };
}
function selectionLabel(selection) {
    if (!selection)
        return '';
    switch (selection.kind) {
        case 'entity': return ` — ${selection.name}`;
        case 'choose': return ' — Choose';
        case 'current-context': return ' — Current Context';
        default: {
            const exhaustive = selection;
            throw new Error(`Unknown list roll: ${JSON.stringify(exhaustive)}`);
        }
    }
}
export function summarizeRandomEvent(event) {
    return `Random Event: ${event.focus.label}${selectionLabel(event.selection)} — ${event.meaning.words[0]} / ${event.meaning.words[1]}`;
}
export function summarizeFate(result) {
    const question = result.question === undefined ? '' : ` "${result.question}"`;
    const event = result.randomEvent ? ` ${summarizeRandomEvent(result.randomEvent)}` : '';
    return `${oddsLabel(result.odds)} @ Chaos ${result.chaosUsed}: ${result.draw} → ${fateOutcomeLabel(result.outcome)}.${question}${event}`;
}
