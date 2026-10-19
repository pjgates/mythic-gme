import { promptText } from "../engine/prompt.js";
export const PROMPT_KEY = 'mythic-gme';
/** In-chat injection one message above the newest, so the narrator reads the rolls right before it answers. */
export const PROMPT_DEPTH = 1;
/**
 * Pushes the document's prompt text to the host when it differs from `last` and returns the text now in force.
 * No document (no chat open, or a chat being opened) means an empty prompt, which is how a chat switch clears the
 * previous chat's rolls immediately. Without the capability nothing is sent and `last` is returned unchanged.
 */
export function syncPrompt(adapter, document, last) {
    const injection = adapter.promptInjection;
    if (!injection.available)
        return last;
    const text = document ? promptText(document) : '';
    if (text !== last)
        injection.set(PROMPT_KEY, text, PROMPT_DEPTH);
    return text;
}
