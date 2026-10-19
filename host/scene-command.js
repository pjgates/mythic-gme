import { errorMessage } from "../engine/errors.js";
import { parseMeaningTableId } from "../engine/meaning.js";
import { isSceneControl } from "../engine/scene.js";
function optionalText(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}
function refusal(what, error) {
    return `${what} refused: ${errorMessage(error)}`;
}
/** `/mythic scene` with optional `event=<actions|descriptions|elements.<name>>` naming an Interrupt's Meaning pair. */
export function sceneCommand(run) {
    return async (named) => {
        const request = {};
        const event = optionalText(named.event);
        if (event !== undefined) {
            const eventMeaning = parseMeaningTableId(event);
            if (!eventMeaning)
                return `Scene Check refused: unknown event Meaning table "${event}" (use actions, descriptions or elements.<name>).`;
            request.eventMeaning = eventMeaning;
        }
        try {
            return (await run(request)).summary;
        }
        catch (error) {
            return refusal('Scene Check', error);
        }
    };
}
/** `/mythic end-scene control=in|out`; the verdict may also be written as the word after `end-scene`. */
export function endSceneCommand(run) {
    return async (named, rest) => {
        const control = (optionalText(named.control) ?? optionalText(rest))?.toLowerCase();
        if (!isSceneControl(control))
            return 'End scene needs a verdict: control=in|out (in control lowers the Chaos Factor, out of control raises it).';
        try {
            return (await run(control)).summary;
        }
        catch (error) {
            return refusal('End scene', error);
        }
    };
}
