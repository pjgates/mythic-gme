import { CHAOS_MAX, clampChaos } from "./chaos.js";
import { projectDice, resolveDice, summarizeDice } from "./dice.js";
import { projectFate, resolveFate, summarizeFate } from "./fate.js";
import { projectList, resolveList, summarizeList } from "./lists.js";
import { resolveClearLog, summarizeClearLog } from "./log.js";
import { projectMeaning, resolveMeaning, summarizeMeaning } from "./meaning.js";
import { resolveNote, summarizeNote } from "./note.js";
import { resolveAcknowledge, resolveSetPromptInjection, summarizeAcknowledge, summarizeSetPromptInjection } from "./prompt.js";
import { projectScene, resolveEndScene, resolveSceneCheck, summarizeEndScene, summarizeSceneCheck } from "./scene.js";
export function projectAdjustChaos(result) {
    const { kind: _kind, ...projection } = result;
    return projection;
}
export function resolve(state, body, die, context) {
    switch (body.kind) {
        case 'adjust-chaos': {
            const before = state.chaosFactor;
            const after = clampChaos(before + body.delta);
            return { result: { kind: 'adjust-chaos', before, after, clamped: after === before }, draws: [],
                state: { ...state, chaosFactor: after } };
        }
        case 'dice': return resolveDice(state, body, die);
        case 'fate': return resolveFate(state, body, die, context.pack);
        case 'meaning': return resolveMeaning(state, body, die, context.pack);
        case 'list': return resolveList(state, body, die);
        case 'clear-log': return resolveClearLog(state, body, die);
        case 'scene-check': return resolveSceneCheck(state, body, die, context.pack);
        case 'end-scene': return resolveEndScene(state, body);
        case 'set-prompt-injection': return resolveSetPromptInjection(state, body);
        case 'acknowledge': return resolveAcknowledge(state, body);
        case 'note': return resolveNote(state, body);
        default: {
            const exhaustive = body;
            throw new Error(`Unknown operation kind: ${String(exhaustive)}`);
        }
    }
}
export function summarize(result) {
    switch (result.kind) {
        case 'adjust-chaos':
            if (!result.clamped)
                return `Chaos Factor ${result.before} → ${result.after}.`;
            return `Chaos Factor stays at ${result.after} (${result.after === CHAOS_MAX ? 'maximum' : 'minimum'}).`;
        case 'dice': return summarizeDice(result);
        case 'fate': return summarizeFate(result);
        case 'meaning': return summarizeMeaning(result);
        case 'list': return summarizeList(result);
        case 'clear-log': return summarizeClearLog(result);
        case 'scene-check': return summarizeSceneCheck(result);
        case 'end-scene': return summarizeEndScene(result);
        case 'set-prompt-injection': return summarizeSetPromptInjection(result);
        case 'acknowledge': return summarizeAcknowledge(result);
        case 'note': return summarizeNote(result);
        default: {
            const exhaustive = result;
            throw new Error(`Unknown result kind: ${String(exhaustive)}`);
        }
    }
}
export function toReceipt(recorded) {
    const copy = structuredClone(recorded);
    return { ...copy, summary: summarize(copy.result), agent: { operationId: copy.operationId, kind: copy.result.kind,
            draws: copy.draws, chaosFactor: copy.chaosFactor, sceneCount: copy.sceneCount,
            ...(copy.result.kind === 'adjust-chaos' ? { adjustChaos: projectAdjustChaos(copy.result) } : {}),
            ...(copy.result.kind === 'dice' ? { dice: projectDice(copy.result) } : {}),
            ...(copy.result.kind === 'fate' ? { fate: projectFate(copy.result) } : {}),
            ...(copy.result.kind === 'meaning' ? { meaning: projectMeaning(copy.result) } : {}),
            ...(copy.result.kind === 'list' ? { list: projectList(copy.result) } : {}),
            ...(copy.result.kind === 'scene-check' ? { scene: projectScene(copy.result) } : {}),
            ...(copy.result.kind === 'end-scene' ? { endScene: copy.result } : {}),
            ...(copy.result.kind === 'note' ? { note: { about: copy.result.about, text: copy.result.text } } : {}),
        } };
}
