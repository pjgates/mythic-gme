import { unavailable } from "./adapter.js";
import { isFunction } from "./globals.js";
/**
 * Capabilities built on the SillyTavern context (`window.SillyTavern.getContext()`), which TauriTavern exposes too:
 * chat-change events, slash commands, function tools, prompt injection, plus the DOM file picker and mount points.
 * Per-chat and global storage differ per host and live in sillytavern.ts / tauritavern.ts.
 */
export function contextOf(window) {
    const getContext = window.SillyTavern?.getContext;
    return isFunction(getContext) ? getContext.call(window.SillyTavern) : undefined;
}
export function missing(context, names) {
    if (!context)
        return 'SillyTavern.getContext() is not available.';
    const absent = names.filter(name => !isFunction(context[name])
        && !isRecordWith(context, name));
    return absent.length ? `SillyTavern context is missing ${absent.join(', ')}.` : undefined;
}
function isRecordWith(context, name) {
    const value = context[name];
    return typeof value === 'object' && value !== null;
}
export function chatIdentity(window, binding, requirements = []) {
    const context = contextOf(window);
    const reason = missing(context, [...requirements, 'eventSource', 'eventTypes']);
    if (reason)
        return unavailable(reason);
    if (!isFunction(context?.eventSource?.on) || !context.eventTypes?.CHAT_CHANGED) {
        return unavailable('SillyTavern context is missing eventSource.on or eventTypes.CHAT_CHANGED.');
    }
    return {
        available: true,
        async current() { const live = contextOf(window); return live ? binding(live) : undefined; },
        onChange(callback) {
            const live = contextOf(window);
            live?.eventSource?.on?.(live.eventTypes.CHAT_CHANGED, () => callback());
        },
    };
}
export function slashCommands(window) {
    const context = contextOf(window);
    const reason = missing(context, ['SlashCommandParser', 'SlashCommand']);
    if (reason)
        return unavailable(reason);
    if (!isFunction(context?.SlashCommandParser?.addCommandObject) || !isFunction(context.SlashCommand?.fromProps)) {
        return unavailable('SillyTavern context is missing SlashCommandParser.addCommandObject or SlashCommand.fromProps.');
    }
    return {
        available: true,
        register(command) {
            const live = contextOf(window);
            const built = live?.SlashCommand?.fromProps?.({ name: command.name, helpString: command.help,
                callback: (named, unnamed) => command.callback(named, unnamed) });
            live?.SlashCommandParser?.addCommandObject?.(built);
        },
    };
}
export function functionTools(window) {
    const reason = missing(contextOf(window), ['registerFunctionTool', 'unregisterFunctionTool']);
    if (reason)
        return unavailable(reason);
    return {
        available: true,
        register(tool) {
            contextOf(window)?.registerFunctionTool?.({ name: tool.name, displayName: tool.displayName,
                description: tool.description, parameters: tool.parameters, action: tool.action,
                ...(tool.formatMessage ? { formatMessage: tool.formatMessage } : {}) });
        },
        unregister(name) { contextOf(window)?.unregisterFunctionTool?.(name); },
    };
}
export function promptInjection(window) {
    const reason = missing(contextOf(window), ['setExtensionPrompt']);
    if (reason)
        return unavailable(reason);
    // Position 1 is "in chat at depth"; role 0 is system.
    return { available: true, set(key, text, depth) { contextOf(window)?.setExtensionPrompt?.(key, text, 1, depth, false, 0); } };
}
export function domFilePicker(window) {
    const document = window.document;
    if (!document || !isFunction(document.createElement))
        return unavailable('No document to host a file picker; paste JSON instead.');
    return {
        available: true,
        pickText() {
            return new Promise(resolve => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json,.json';
                input.onchange = async () => { resolve(await input.files?.[0]?.text()); };
                input.oncancel = () => resolve(undefined);
                input.click();
            });
        },
    };
}
export function domMountPoints(window) {
    const document = window.document;
    if (!document || !isFunction(document.querySelector))
        return { composer: null, column: null };
    return { composer: document.querySelector('#form_sheld'), column: document.querySelector('#sheld') };
}
const COMPOSER_SELECTOR = '#send_textarea';
/**
 * "To chat" appends text to the host's message box and leaves the caret at the end for the player to edit; the host
 * hears an `input` event so it resizes and tracks the draft. Nothing is ever sent.
 */
export function domComposer(window) {
    const document = window.document;
    if (!document || !isFunction(document.querySelector))
        return unavailable('No document to host the chat composer.');
    if (!document.querySelector(COMPOSER_SELECTOR))
        return unavailable(`No ${COMPOSER_SELECTOR} message box in this document.`);
    return {
        available: true,
        insert(text) {
            const box = document.querySelector(COMPOSER_SELECTOR);
            if (!box || typeof box.value !== 'string')
                return false;
            const current = box.value;
            const separator = current === '' || current.endsWith('\n') ? '' : '\n';
            box.value = `${current}${separator}${text}`;
            box.dispatchEvent?.(new Event('input', { bubbles: true }));
            box.focus?.();
            box.setSelectionRange?.(box.value.length, box.value.length);
            return true;
        },
    };
}
