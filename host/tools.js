import { CHAOS_DELTAS, ODDS_IDS } from "../engine/agent.js";
import { CHAOS_MAX, CHAOS_MIN } from "../engine/chaos.js";
import { LIST_ACTION_KINDS, LIST_KINDS } from "../engine/lists.js";
import { SCENE_CONTROLS } from "../engine/scene.js";
const MEANING_TABLE = 'Meaning table id: "actions", "descriptions" or "elements.<name>" from the active table pack.';
const RESULT_NOTE = 'Returns a structured result (every draw in order, Chaos Factor, outcome) or { refused: true, reason }.';
const CHAOS_RANGE = `${CHAOS_MIN}-${CHAOS_MAX}`;
function schema(properties, required = []) {
    return { type: 'object', properties, required, additionalProperties: false };
}
/** One tool per agent kind; schemas and the validator in `engine/agent.ts` share the same enum constants. */
export const MYTHIC_TOOLS = [
    { kind: 'fate', name: 'mythic_fate_check', displayName: 'Mythic Fate Check',
        description: `Ask the Mythic GME oracle a yes/no question at the given odds. Rolls d100 on the Fate Chart against the current Chaos Factor; a doubles draw also resolves a Random Event (focus, list target, Meaning words) in the same call. ${RESULT_NOTE}`,
        parameters: schema({
            odds: { type: 'string', enum: [...ODDS_IDS], description: 'How likely a "yes" is.' },
            question: { type: 'string', description: 'The yes/no question being asked, recorded on the receipt.' },
            chaosOverride: { type: 'integer', minimum: CHAOS_MIN, maximum: CHAOS_MAX, description: 'Use this Chaos Factor row for this check only.' },
            eventMeaning: { type: 'string', description: `${MEANING_TABLE} Used for a triggered Random Event; "actions" when omitted.` },
        }, ['odds']) },
    { kind: 'scene', name: 'mythic_scene_check', displayName: 'Mythic Scene Check',
        description: `Test whether the next scene starts as expected. Rolls d10 against the Chaos Factor: Expected, Altered (with Scene Adjustment) or Interrupt (with a Random Event resolved in the same call). ${RESULT_NOTE}`,
        parameters: schema({
            eventMeaning: { type: 'string', description: `${MEANING_TABLE} Used for an Interrupt Scene's Random Event; "actions" when omitted.` },
        }) },
    { kind: 'meaning', name: 'mythic_meaning', displayName: 'Mythic Meaning Tables',
        description: `Roll a Meaning word pair from the active table pack for inspiration. ${RESULT_NOTE}`,
        parameters: schema({
            table: { type: 'string', description: MEANING_TABLE },
            parentOperationId: { type: 'string', description: 'Operation id of the receipt this pair elaborates on, if any.' },
            question: { type: 'string', description: 'What the pair should answer, kept with the receipt.' },
        }, ['table']) },
    { kind: 'endScene', name: 'mythic_end_scene', displayName: 'Mythic End Scene',
        description: `End the current scene. "in" (the characters stayed in control) lowers the Chaos Factor by one, "out" raises it by one, within ${CHAOS_RANGE}; the scene count advances. ${RESULT_NOTE}`,
        parameters: schema({
            control: { type: 'string', enum: [...SCENE_CONTROLS], description: 'Whether the player characters were in control of the scene.' },
        }, ['control']) },
    { kind: 'adjustChaos', name: 'mythic_adjust_chaos', displayName: 'Mythic Adjust Chaos Factor',
        description: `Move the Chaos Factor one step up or down without ending a scene (clamped to ${CHAOS_RANGE}). ${RESULT_NOTE}`,
        parameters: schema({
            delta: { type: 'integer', enum: [...CHAOS_DELTAS], description: '+1 raises, -1 lowers the Chaos Factor.' },
        }, ['delta']) },
    { kind: 'list', name: 'mythic_list', displayName: 'Mythic Adventure Lists',
        description: `Manage or roll on the Characters or Threads Adventure List. Actions: add (name), weight/unweight/remove (id), rename (id, name), clear, roll. A roll returns the selected entry, "choose" for a blank slot or "current-context" for an empty list. ${RESULT_NOTE}`,
        parameters: schema({
            list: { type: 'string', enum: [...LIST_KINDS], description: 'Which Adventure List.' },
            action: { type: 'object', additionalProperties: false, required: ['kind'], properties: {
                    kind: { type: 'string', enum: [...LIST_ACTION_KINDS] },
                    name: { type: 'string', description: 'Entry name for add and rename.' },
                    id: { type: 'string', description: 'Entry id (as returned in list results) for weight, unweight, rename and remove.' },
                } },
        }, ['list', 'action']) },
    { kind: 'dice', name: 'mythic_roll_dice', displayName: 'Mythic Roll Dice',
        description: `Roll dice with a real random source: NdX with optional keep-highest/lowest and modifier, e.g. "2d6", "4d6kh3+2", "d100", "4dF". ${RESULT_NOTE}`,
        parameters: schema({
            expression: { type: 'string', description: 'Dice expression in NdX grammar.' },
        }, ['expression']) },
];
export const MYTHIC_TOOL_NAMES = MYTHIC_TOOLS.map(tool => tool.name);
/** Registers every tool through the host's function-tool capability; each action answers with the runner's structured result. */
export function registerMythicTools(adapter, run) {
    const tools = adapter.functionTools;
    if (!tools.available)
        return { registered: false, names: [], reason: tools.reason };
    for (const tool of MYTHIC_TOOLS)
        tools.register(toolSpec(tool, run));
    return { registered: true, names: MYTHIC_TOOL_NAMES };
}
function toolSpec(tool, run) {
    return {
        name: tool.name, displayName: tool.displayName, description: tool.description, parameters: tool.parameters,
        action: args => run(tool.kind, args),
        formatMessage: () => `${tool.displayName}…`,
    };
}
