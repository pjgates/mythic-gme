import { errorMessage } from "../engine/errors.js";
import { LIST_ACTION_KINDS, LIST_KINDS } from "../engine/lists.js";
export const LIST_HELP = `/mythic list <${LIST_KINDS.join('|')}> <${LIST_ACTION_KINDS.join('|')}> [name=…] [id=…]`;
/**
 * `/mythic list characters add name="Captain Reyes"`, `… weight id=characters-1`, `… rename id=… name=…`,
 * `… remove id=…`, `… clear`, `… roll`. Pure, so refusals are testable without a host.
 */
export function parseListCommand(named, rest) {
    const [listWord, actionWord, ...extra] = rest;
    const refuse = (error) => ({ ok: false, error: `${error} Usage: ${LIST_HELP}` });
    const list = LIST_KINDS.find(kind => kind === listWord);
    if (!list)
        return refuse(`Expected a list (${LIST_KINDS.join(' or ')}), got "${listWord ?? ''}".`);
    const action = LIST_ACTION_KINDS.find(kind => kind === actionWord);
    if (!action)
        return refuse(`Expected an action (${LIST_ACTION_KINDS.join('|')}), got "${actionWord ?? ''}".`);
    if (extra.length)
        return refuse(`Unexpected words: ${extra.join(' ')}.`);
    const name = text(named.name);
    const id = text(named.id);
    const needName = () => refuse(`${action} needs name=…`);
    const needId = () => refuse(`${action} needs id=…`);
    const body = (parsed) => ({ ok: true, body: { kind: 'list', list, action: parsed } });
    switch (action) {
        case 'add': return name ? body({ kind: 'add', name }) : needName();
        case 'weight': return id ? body({ kind: 'weight', id }) : needId();
        case 'unweight': return id ? body({ kind: 'unweight', id }) : needId();
        case 'rename': return !id ? needId() : !name ? needName() : body({ kind: 'rename', id, name });
        case 'remove': return id ? body({ kind: 'remove', id }) : needId();
        case 'clear': return body({ kind: 'clear' });
        case 'roll': return body({ kind: 'roll' });
        default: {
            const exhaustive = action;
            throw new Error(`Unknown list action: ${JSON.stringify(exhaustive)}`);
        }
    }
}
/** The `list` subcommand: parse, submit through the controller, answer with the receipt summary or a refusal. */
export function listCommand(submit) {
    return async (named, rest) => {
        const parsed = parseListCommand(named, rest.trim().split(/\s+/).filter(Boolean));
        if (!parsed.ok)
            return `Refused: ${parsed.error}`;
        try {
            return (await submit(parsed.body)).summary;
        }
        catch (error) {
            return `Refused: ${errorMessage(error)}`;
        }
    };
}
function text(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}
