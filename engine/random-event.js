// WORKING TRANSCRIPTION — awaiting Peter's confirmation against Mythic GME 2e pp. 36–43 (Random Event Focus).
// Data only: swapping in confirmed ranges is a change to this table and to test/fixtures/random-event-focus.json.
import { rollList } from "./lists.js";
import { resolveMeaning } from "./meaning.js";
export const RANDOM_EVENT_FOCUS = [
    { id: 'remote-event', label: 'Remote Event', range: [1, 5] },
    { id: 'ambiguous-event', label: 'Ambiguous Event', range: [6, 10] },
    { id: 'new-npc', label: 'New NPC', range: [11, 20] },
    { id: 'npc-action', label: 'NPC Action', range: [21, 40], list: 'characters' },
    { id: 'npc-negative', label: 'NPC Negative', range: [41, 45], list: 'characters' },
    { id: 'npc-positive', label: 'NPC Positive', range: [46, 50], list: 'characters' },
    { id: 'move-toward-thread', label: 'Move Toward A Thread', range: [51, 55], list: 'threads' },
    { id: 'move-away-from-thread', label: 'Move Away From A Thread', range: [56, 65], list: 'threads' },
    { id: 'close-thread', label: 'Close A Thread', range: [66, 70], list: 'threads' },
    { id: 'pc-negative', label: 'PC Negative', range: [71, 80] },
    { id: 'pc-positive', label: 'PC Positive', range: [81, 85] },
    { id: 'current-context', label: 'Current Context', range: [86, 100] },
];
export function focusFor(draw) {
    const found = RANDOM_EVENT_FOCUS.find(focus => focus.range[0] <= draw && draw <= focus.range[1]);
    if (!found)
        throw new Error(`Random Event Focus draw must be 1–100, got ${String(draw)}.`);
    return found;
}
/**
 * Fixed order: Focus d100, then the list roll only when the focus names a list (an empty list is Current Context
 * with no draws, as `rollList` already decides), then the Meaning pair. Every draw is returned in that order.
 */
export function resolveRandomEvent(state, die, pack, meaningTable = 'actions') {
    const focusDraw = die(100);
    const focus = focusFor(focusDraw);
    const selection = focus.list ? { ...rollList(state.lists[focus.list], die), list: focus.list } : undefined;
    const { result, draws: meaningDraws } = resolveMeaning(state, { kind: 'meaning', table: meaningTable }, die, pack);
    const { kind: _kind, ...meaning } = result;
    return {
        focus: { id: focus.id, label: focus.label, draw: focusDraw },
        ...(selection ? { selection } : {}),
        meaning,
        draws: [focusDraw, ...(selection?.draws ?? []), ...meaningDraws],
    };
}
