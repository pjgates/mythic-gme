import { expectedScene, noteFor } from "./note.js";
import { toReceipt } from "./operation.js";
export function resolveSetPromptInjection(state, body) {
    const enabled = body.enabled === true;
    return { result: { kind: 'set-prompt-injection', enabled }, draws: [], state: { ...state, promptInjection: enabled } };
}
/**
 * Acknowledgement never edits earlier journal entries: the acknowledge receipt itself is the boundary that later
 * `injectableReceipts` reads stop at, the same way a `clear-log` receipt bounds the visible log.
 */
export function resolveAcknowledge(state, _body) {
    return { result: { kind: 'acknowledge', count: injectableEntries(state.journal).length }, draws: [], state };
}
export function summarizeSetPromptInjection(result) {
    return `Prompt injection ${result.enabled ? 'on' : 'off'}.`;
}
export function summarizeAcknowledge(result) {
    return `Acknowledged ${result.count} ${result.count === 1 ? 'roll' : 'rolls'}.`;
}
/**
 * Receipts that end the injectable set: a scene boundary, an acknowledgement, or a log clear (receipts hidden from
 * the roll log are not fed to the narrator either, so the two views never disagree).
 */
function isBoundary(kind) {
    return kind === 'end-scene' || kind === 'acknowledge' || kind === 'clear-log';
}
/**
 * "Recent manual rolls": dice, Fate and Scene Checks, Meaning pairs and list *rolls*; list edits and Chaos steps are
 * not rolls. The scene feed shows the same set, so what the player sees and what the narrator hears never disagree.
 */
export function isRoll(result) {
    switch (result.kind) {
        case 'dice':
        case 'fate':
        case 'meaning':
        case 'scene-check': return true;
        case 'list': return result.outcome.kind === 'entity' || result.outcome.kind === 'choose' || result.outcome.kind === 'current-context';
        case 'adjust-chaos':
        case 'clear-log':
        case 'end-scene':
        case 'set-prompt-injection':
        case 'acknowledge':
        case 'note': return false;
        default: {
            const exhaustive = result;
            throw new Error(`Unknown result kind: ${String(exhaustive)}`);
        }
    }
}
function injectableEntries(journal) {
    const entries = [];
    for (let index = journal.length - 1; index >= 0; index--) {
        const entry = journal[index];
        if (isBoundary(entry.result.kind))
            break;
        if (entry.caller !== 'human' || !isRoll(entry.result))
            continue;
        entries.push(entry);
    }
    return entries.reverse();
}
/**
 * The current scene's manual rolls the narrator has not yet seen, oldest first: every human-triggered roll recorded
 * after the latest end-scene, acknowledge or clear-log receipt. Agent rolls (the model already received those), list
 * edits, Chaos steps and the toggle operations themselves are never injected.
 */
export function injectableReceipts(document) {
    return injectableEntries(document.journal).map(toReceipt);
}
/**
 * Plain text for the host's extension prompt: empty when the toggle is off or nothing is injectable. The player's
 * interpretation of a roll follows it indented, and the expected-scene line heads the block when one is written.
 */
export function promptText(document) {
    if (!document.promptInjection)
        return '';
    const receipts = injectableReceipts(document);
    if (receipts.length === 0)
        return '';
    const expected = expectedScene(document);
    return [`Mythic GME rolls this scene (Chaos Factor ${document.chaosFactor}):`,
        ...(expected === undefined ? [] : [`Expected scene: ${expected}`]),
        ...receipts.flatMap(receipt => {
            const note = noteFor(document, receipt.operationId);
            return note === undefined ? [`- ${receipt.summary}`] : [`- ${receipt.summary}`, `  Interpretation: ${note}`];
        })].join('\n');
}
