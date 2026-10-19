import { clampChaos } from "./chaos.js";
import { summarizeRandomEvent } from "./fate.js";
import { assertMeaningTable } from "./meaning.js";
import { resolveRandomEvent } from "./random-event.js";
export const SCENE_ADJUSTMENT = [
    { draw: 1, id: 'remove-character', label: 'Remove A Character' },
    { draw: 2, id: 'add-character', label: 'Add A Character' },
    { draw: 3, id: 'reduce-activity', label: 'Reduce/Remove An Activity' },
    { draw: 4, id: 'increase-activity', label: 'Increase An Activity' },
    { draw: 5, id: 'remove-object', label: 'Remove An Object' },
    { draw: 6, id: 'add-object', label: 'Add An Object' },
    { draw: 7, id: 'two-adjustments', label: 'Make 2 Adjustments' },
    { draw: 8, id: 'two-adjustments', label: 'Make 2 Adjustments' },
    { draw: 9, id: 'two-adjustments', label: 'Make 2 Adjustments' },
    { draw: 10, id: 'two-adjustments', label: 'Make 2 Adjustments' },
];
export function sceneAdjustmentFor(draw) {
    const found = SCENE_ADJUSTMENT.find(entry => entry.draw === draw);
    if (!found)
        throw new Error(`Scene Adjustment draw must be 1–10, got ${String(draw)}.`);
    return found;
}
export function projectScene(result) {
    const { kind: _kind, randomEvent, ...rest } = result;
    return { ...rest, randomEvent: randomEvent !== undefined, ...(randomEvent ? { event: randomEvent } : {}) };
}
const OUTCOME_LABELS = { expected: 'Expected', altered: 'Altered', interrupt: 'Interrupt' };
export function sceneOutcomeLabel(outcome) {
    return OUTCOME_LABELS[outcome];
}
/** Above the Chaos Factor is Expected and so is a 10; at or below, odd is Altered and even is Interrupt. */
export function sceneOutcome(draw, chaos) {
    if (draw === 10 || draw > chaos)
        return 'expected';
    return draw % 2 === 1 ? 'altered' : 'interrupt';
}
/** With a fair d10 the odds of this many non-qualifying draws in a row are negligible; hitting it means a broken die. */
const MAX_ADJUSTMENT_DRAWS = 20;
/**
 * One d10 on the Scene Adjustment table. "Make 2 Adjustments" keeps drawing until two distinct rows from 1–6 are
 * collected; further 7–10 draws and duplicates are recorded as draws but discarded.
 */
export function rollSceneAdjustments(die) {
    const draws = [];
    const next = () => { const draw = die(10); draws.push(draw); return sceneAdjustmentFor(draw); };
    const first = next();
    if (first.id !== 'two-adjustments')
        return { adjustments: [{ ...first }], draws };
    const kept = [];
    while (kept.length < 2) {
        if (draws.length >= MAX_ADJUSTMENT_DRAWS) {
            throw new Error(`Scene Adjustment found no two distinct adjustments in ${MAX_ADJUSTMENT_DRAWS} draws; check the die source.`);
        }
        const entry = next();
        if (entry.id === 'two-adjustments' || kept.some(adjustment => adjustment.id === entry.id))
            continue;
        kept.push({ ...entry });
    }
    return { adjustments: kept, draws };
}
/**
 * One d10 against the saved Chaos Factor. An Altered Scene rolls its adjustment(s) and an Interrupt Scene resolves a
 * full Random Event inside this same operation, so one receipt carries every draw in order: scene d10, then either
 * the adjustment d10s or the event chain (Focus d100, list roll when the focus names a list, Meaning pair).
 */
export function resolveSceneCheck(state, body, die, pack) {
    if (body.eventMeaning !== undefined)
        assertMeaningTable(body.eventMeaning, pack);
    const draw = die(10);
    const outcome = sceneOutcome(draw, state.chaosFactor);
    const result = { kind: 'scene-check', draw, chaosFactor: state.chaosFactor, outcome };
    const draws = [draw];
    switch (outcome) {
        case 'expected': break;
        case 'altered': {
            const rolled = rollSceneAdjustments(die);
            result.adjustments = rolled.adjustments;
            draws.push(...rolled.draws);
            break;
        }
        case 'interrupt': {
            const { draws: eventDraws, ...randomEvent } = resolveRandomEvent(state, die, pack, body.eventMeaning);
            result.randomEvent = randomEvent;
            draws.push(...eventDraws);
            break;
        }
        default: {
            const exhaustive = outcome;
            throw new Error(`Unknown scene outcome: ${String(exhaustive)}`);
        }
    }
    return { result, draws, state };
}
export const SCENE_CONTROLS = ['in', 'out'];
export function isSceneControl(value) {
    return value === 'in' || value === 'out';
}
/**
 * The scene's verdict moves the Chaos Factor one step (in control: −1, out of control: +1) within 1–9 and advances the
 * scene count. Scene state is advisory: nothing here guards against rolling without ending a scene first.
 */
export function resolveEndScene(state, body) {
    if (!isSceneControl(body.control))
        throw new Error(`End scene needs control "in" or "out", got ${JSON.stringify(body.control)}.`);
    const before = state.chaosFactor;
    const after = clampChaos(before + (body.control === 'in' ? -1 : 1));
    const endedScene = state.sceneCount;
    const nextScene = endedScene + 1;
    const result = { kind: 'end-scene', control: body.control, before, after, clamped: after === before, endedScene, nextScene };
    return { result, draws: [], state: { ...state, chaosFactor: after, sceneCount: nextScene } };
}
export function summarizeEndScene(result) {
    const chaos = result.clamped
        ? `Chaos Factor stays at ${result.after} (${result.control === 'out' ? 'maximum' : 'minimum'})`
        : `Chaos Factor ${result.before} → ${result.after}`;
    return `Scene ${result.endedScene} ended ${result.control === 'in' ? 'in control' : 'out of control'}: ${chaos}. Scene ${result.nextScene} begins.`;
}
export function summarizeSceneCheck(result) {
    const head = `Scene Check @ Chaos ${result.chaosFactor}: ${result.draw} → ${sceneOutcomeLabel(result.outcome)}`;
    switch (result.outcome) {
        case 'expected': return `${head}.`;
        case 'altered': return `${head} — ${(result.adjustments ?? []).map(adjustment => adjustment.label).join(' and ')}.`;
        case 'interrupt': return result.randomEvent ? `${head} — ${summarizeRandomEvent(result.randomEvent)}` : `${head}.`;
        default: {
            const exhaustive = result.outcome;
            throw new Error(`Unknown scene outcome: ${String(exhaustive)}`);
        }
    }
}
