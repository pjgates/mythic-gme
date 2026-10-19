import { errorMessage } from "../engine/errors.js";
export const CHAOS_USAGE = '/mythic chaos <up|down> (or delta=1|-1, +1, -1)';
function deltaWord(value) {
    const word = String(value).trim().toLowerCase();
    if (word === 'up' || word === '+1' || word === '1')
        return 1;
    if (word === 'down' || word === '-1')
        return -1;
    return undefined;
}
/** `delta=` wins over the word after `chaos`; exactly one word is accepted so `up down` is refused rather than guessed. */
export function parseChaosDelta(named, rest) {
    if (named.delta !== undefined && named.delta !== '')
        return deltaWord(named.delta);
    const words = rest.trim().split(/\s+/).filter(Boolean);
    return words.length === 1 ? deltaWord(words[0]) : undefined;
}
/** `/mythic chaos up`, `/mythic chaos down`, `/mythic chaos delta=-1`: one recorded adjust-chaos step; anything else changes nothing. */
export function chaosCommand(adjust) {
    return async (named, rest) => {
        const delta = parseChaosDelta(named, rest);
        if (delta === undefined)
            return `Chaos Factor needs a direction: ${CHAOS_USAGE}.`;
        try {
            return (await adjust(delta)).summary;
        }
        catch (error) {
            return `Chaos Factor refused: ${errorMessage(error)}`;
        }
    };
}
