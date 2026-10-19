import { errorMessage } from "../engine/errors.js";
import { ODDS } from "../engine/fate-chart.js";
import { parseMeaningTableId } from "../engine/meaning.js";
const ODDS_IDS = ODDS.map(odds => odds.id).join('|');
/** Accepts an odds id (`likely`), its label in any case (`Nearly Certain`, `50/50`) or words (`very unlikely`). */
export function parseOdds(text) {
    if (typeof text !== 'string')
        return undefined;
    const key = text.trim().toLowerCase().replace(/[\s_]+/g, '-');
    if (key === '50/50' || key === '50-50')
        return 'fifty-fifty';
    return ODDS.find(odds => odds.id === key || odds.label.toLowerCase() === key)?.id;
}
function optionalText(value) {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}
/**
 * `/mythic fate odds=likely question="..." chaos=7 event=descriptions`; odds may also be given as the words after
 * `fate`. `event` names the Meaning pair a triggered Random Event rolls (`actions` by default, `descriptions`,
 * `elements.<name>`).
 */
export function fateCommand(run) {
    return async (named, rest) => {
        const odds = parseOdds(named.odds ?? rest);
        if (!odds)
            return `Fate Check needs odds: odds=<${ODDS_IDS}> (or write the odds after "fate").`;
        const request = { odds };
        const question = optionalText(named.question);
        if (question !== undefined)
            request.question = question;
        const chaos = optionalText(named.chaos);
        if (chaos !== undefined)
            request.chaosOverride = Number(chaos);
        const event = optionalText(named.event);
        if (event !== undefined) {
            const eventMeaning = parseMeaningTableId(event);
            if (!eventMeaning)
                return `Fate Check refused: unknown event Meaning table "${event}" (use actions, descriptions or elements.<name>).`;
            request.eventMeaning = eventMeaning;
        }
        try {
            return (await run(request)).summary;
        }
        catch (error) {
            return `Fate Check refused: ${errorMessage(error)}`;
        }
    };
}
