/**
 * What "To chat" drops into the composer: the roll as one bracketed line the player can keep or delete, then their
 * interpretation as plain narration underneath. The player edits and sends; nothing here reaches the chat on its own.
 */
export function chatText(receipt, note) {
    const line = `[Mythic] ${receipt.summary}`;
    return note === undefined || note === '' ? line : `${line}\n${note}`;
}
