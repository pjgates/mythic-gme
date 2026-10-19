import { errorMessage } from "../engine/errors.js";
export const COMMAND_NAME = 'mythic';
/**
 * Registers the single `/mythic` slash command; the first unnamed word picks the handler. When the host offers no
 * slash commands nothing is registered: the drawer's capability notice already tells the player.
 */
export function registerMythicCommand(adapter, handlers) {
    const commands = adapter.slashCommands;
    if (!commands.available)
        return;
    commands.register({ name: COMMAND_NAME, help: usage(handlers), callback: (named, unnamed) => dispatch(handlers, named, unnamed) });
}
async function dispatch(handlers, named, unnamed) {
    const [subcommand = '', ...rest] = unnamedText(unnamed).trim().split(/\s+/).filter(Boolean);
    const handler = Object.hasOwn(handlers, subcommand) ? handlers[subcommand] : undefined;
    if (!handler)
        return subcommand ? `Unknown subcommand '${subcommand}'. ${usage(handlers)}` : usage(handlers);
    try {
        return await handler(named, rest.join(' '));
    }
    catch (error) {
        return errorMessage(error);
    }
}
function unnamedText(unnamed) {
    if (Array.isArray(unnamed))
        return unnamed.map(String).join(' ');
    return unnamed === undefined || unnamed === null ? '' : String(unnamed);
}
function usage(handlers) {
    return `Usage: /${COMMAND_NAME} <subcommand> [arguments]. Subcommands: ${Object.keys(handlers).sort().join(', ')}.`;
}
