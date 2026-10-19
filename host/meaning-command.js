import { errorMessage } from "../engine/errors.js";
import { parseMeaningTableId } from "../engine/meaning.js";
import { tableIds } from "../engine/table-pack.js";
/**
 * `/mythic meaning table=descriptions`, `/mythic meaning elements.locations`; `table` defaults to `actions`.
 * The roll goes through the controller, so the returned summary is the saved receipt's.
 */
export function meaningCommand(roll, activePack) {
    return async (named, rest) => {
        const [firstWord] = rest.trim().split(/\s+/).filter(Boolean);
        const requested = typeof named.table === 'string' && named.table !== '' ? named.table : firstWord ?? 'actions';
        const table = parseMeaningTableId(requested);
        if (!table) {
            return `Unknown Meaning table "${requested}". Available: ${tableIds(activePack()).map(entry => entry.id).join(', ')}.`;
        }
        try {
            return (await roll(table)).summary;
        }
        catch (error) {
            return errorMessage(error);
        }
    };
}
