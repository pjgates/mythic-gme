import { CHAOS_MAX, CHAOS_MIN, isChaosFactor } from "./chaos.js";
import { parseDice } from "./dice.js";
import { errorMessage } from "./errors.js";
import { ODDS, isOddsId } from "./fate-chart.js";
import { isRecord } from "./guards.js";
import { LIST_ACTION_KINDS, LIST_KINDS } from "./lists.js";
import { parseMeaningTableId } from "./meaning.js";
import { isSceneControl } from "./scene.js";
/** The seven operations an AI GM (function tool) or a script (`window.MythicGME`) can ask for. */
export const AGENT_KINDS = ['fate', 'scene', 'meaning', 'endScene', 'adjustChaos', 'list', 'dice'];
export const ODDS_IDS = ODDS.map(odds => odds.id);
export const CHAOS_DELTAS = [1, -1];
export function isAgentKind(value) {
    return AGENT_KINDS.some(kind => kind === value);
}
export function isAgentRefusal(value) {
    return isRecord(value) && value.refused === true && typeof value.reason === 'string';
}
export function refusal(reason) {
    return { refused: true, reason };
}
/**
 * Turns a tool call or API call into an operation body, refusing (by throwing an `AgentRefusal`) anything that is
 * not exactly the typed shape the engine validates. Meaning tables are named by id on the agent surface: `actions`,
 * `descriptions` or `elements.<name>`. Nothing here rolls, so a refusal costs no draw and no journal entry.
 */
export function parseAgentRequest(kind, args) {
    if (!isAgentKind(kind))
        throw refusal(`Unknown kind "${kind}"; expected one of ${AGENT_KINDS.join(', ')}.`);
    const fields = argumentsOf(args);
    switch (kind) {
        case 'fate': {
            only(fields, ['odds', 'question', 'chaosOverride', 'eventMeaning']);
            const odds = fields.odds;
            if (!isOddsId(odds))
                throw refusal(`odds must be one of ${ODDS_IDS.join(', ')}, got ${JSON.stringify(odds)}.`);
            const body = { kind: 'fate', odds };
            const question = optionalString(fields, 'question');
            if (question !== undefined)
                body.question = question;
            const chaosOverride = fields.chaosOverride;
            if (chaosOverride !== undefined) {
                if (!isChaosFactor(chaosOverride)) {
                    throw refusal(`chaosOverride must be a whole number from ${CHAOS_MIN} to ${CHAOS_MAX}, got ${JSON.stringify(chaosOverride)}.`);
                }
                body.chaosOverride = chaosOverride;
            }
            const eventMeaning = optionalTable(fields, 'eventMeaning');
            if (eventMeaning !== undefined)
                body.eventMeaning = eventMeaning;
            return body;
        }
        case 'scene': {
            only(fields, ['eventMeaning']);
            const eventMeaning = optionalTable(fields, 'eventMeaning');
            return eventMeaning === undefined ? { kind: 'scene-check' } : { kind: 'scene-check', eventMeaning };
        }
        case 'meaning': {
            only(fields, ['table', 'parentOperationId', 'question']);
            const table = optionalTable(fields, 'table');
            if (table === undefined)
                throw refusal('table is required: actions, descriptions or elements.<name>.');
            const body = { kind: 'meaning', table };
            const parentOperationId = optionalString(fields, 'parentOperationId');
            if (parentOperationId !== undefined)
                body.parentOperationId = parentOperationId;
            const question = optionalString(fields, 'question');
            if (question !== undefined)
                body.question = question;
            return body;
        }
        case 'endScene': {
            only(fields, ['control']);
            if (!isSceneControl(fields.control))
                throw refusal(`control must be "in" or "out", got ${JSON.stringify(fields.control)}.`);
            return { kind: 'end-scene', control: fields.control };
        }
        case 'adjustChaos': {
            only(fields, ['delta']);
            const delta = fields.delta;
            if (delta !== 1 && delta !== -1)
                throw refusal(`delta must be 1 or -1, got ${JSON.stringify(delta)}.`);
            return { kind: 'adjust-chaos', delta };
        }
        case 'list': {
            only(fields, ['list', 'action']);
            const list = LIST_KINDS.find(candidate => candidate === fields.list);
            if (!list)
                throw refusal(`list must be ${LIST_KINDS.join(' or ')}, got ${JSON.stringify(fields.list)}.`);
            return { kind: 'list', list, action: listAction(fields.action) };
        }
        case 'dice': {
            only(fields, ['expression']);
            const expression = optionalString(fields, 'expression');
            if (expression === undefined)
                throw refusal('expression is required, e.g. "2d6", "4d6kh3+2", "d100" or "4dF".');
            try {
                parseDice(expression);
            }
            catch (error) {
                throw refusal(errorMessage(error));
            }
            return { kind: 'dice', expression };
        }
        default: {
            const exhaustive = kind;
            throw refusal(`Unknown kind ${String(exhaustive)}.`);
        }
    }
}
function listAction(raw) {
    if (!isRecord(raw))
        throw refusal(`action must be an object with a kind (${LIST_ACTION_KINDS.join(', ')}).`);
    const kind = LIST_ACTION_KINDS.find(candidate => candidate === raw.kind);
    if (!kind)
        throw refusal(`action.kind must be one of ${LIST_ACTION_KINDS.join(', ')}, got ${JSON.stringify(raw.kind)}.`);
    const name = () => {
        const value = optionalString(raw, 'name', 'action.name');
        if (value === undefined)
            throw refusal(`action "${kind}" needs a non-empty action.name.`);
        return value;
    };
    const id = () => {
        const value = optionalString(raw, 'id', 'action.id');
        if (value === undefined)
            throw refusal(`action "${kind}" needs action.id.`);
        return value;
    };
    switch (kind) {
        case 'add':
            only(raw, ['kind', 'name'], 'action');
            return { kind, name: name() };
        case 'weight':
            only(raw, ['kind', 'id'], 'action');
            return { kind, id: id() };
        case 'unweight':
            only(raw, ['kind', 'id'], 'action');
            return { kind, id: id() };
        case 'rename':
            only(raw, ['kind', 'id', 'name'], 'action');
            return { kind, id: id(), name: name() };
        case 'remove':
            only(raw, ['kind', 'id'], 'action');
            return { kind, id: id() };
        case 'clear':
            only(raw, ['kind'], 'action');
            return { kind };
        case 'roll':
            only(raw, ['kind'], 'action');
            return { kind };
        default: {
            const exhaustive = kind;
            throw refusal(`Unknown list action ${String(exhaustive)}.`);
        }
    }
}
/** Tools may be called with no arguments at all; anything else must be a plain object. */
function argumentsOf(args) {
    if (args === undefined || args === null)
        return {};
    if (!isRecord(args))
        throw refusal(`Arguments must be an object, got ${JSON.stringify(args)}.`);
    return args;
}
function only(fields, allowed, scope = 'arguments') {
    const unexpected = Object.keys(fields).filter(key => !allowed.includes(key) && fields[key] !== undefined);
    if (unexpected.length)
        throw refusal(`Unexpected ${scope}: ${unexpected.join(', ')}; allowed: ${allowed.join(', ')}.`);
}
function optionalString(fields, key, label = key) {
    const value = fields[key];
    if (value === undefined)
        return undefined;
    if (typeof value !== 'string')
        throw refusal(`${label} must be a string, got ${JSON.stringify(value)}.`);
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
}
function optionalTable(fields, key) {
    const id = optionalString(fields, key);
    if (id === undefined)
        return undefined;
    const table = parseMeaningTableId(id);
    if (!table)
        throw refusal(`${key} must be actions, descriptions or elements.<name>, got ${JSON.stringify(id)}.`);
    return table;
}
