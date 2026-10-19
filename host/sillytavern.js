import { unavailable } from "./adapter.js";
import { chatIdentity, contextOf, domComposer, domFilePicker, domMountPoints, functionTools, missing, promptInjection, slashCommands } from "./context-capabilities.js";
import { isFunction } from "./globals.js";
/** Keys under which this extension keeps its own data; nothing else in the host objects is touched. */
export const METADATA_KEY = 'mythic_gme';
export const SETTINGS_KEY = 'mythic_gme';
export function currentChatId(context) {
    const id = isFunction(context.getCurrentChatId) ? context.getCurrentChatId() : context.chatId;
    return id || undefined;
}
export function sillyTavernBinding(context) {
    const chatId = currentChatId(context);
    if (!chatId)
        return undefined;
    const owner = context.groupId ? `group:${context.groupId}` : `character:${context.characterId ?? ''}`;
    return `st:${owner}:${chatId}`;
}
export function metadataStorage(window) {
    const reason = missing(contextOf(window), ['chatMetadata', 'saveMetadata']);
    if (reason)
        return unavailable(reason);
    const live = () => {
        const context = contextOf(window);
        if (!context?.chatMetadata || !isFunction(context.saveMetadata))
            throw new Error('Chat metadata is no longer available.');
        return context;
    };
    return {
        available: true,
        async load(binding) {
            const context = live();
            if (sillyTavernBinding(context) !== binding)
                throw new Error('Chat changed before its Mythic state could be read.');
            return context.chatMetadata[METADATA_KEY];
        },
        async save(binding, document) {
            const context = live();
            // Chat metadata only exists for the current chat, so a late write cannot reach its original chat here.
            if (sillyTavernBinding(context) !== binding)
                throw new Error('Chat changed; this result was not saved to another chat.');
            context.chatMetadata[METADATA_KEY] = document;
            await context.saveMetadata();
        },
    };
}
export function settingsStorage(window) {
    const reason = missing(contextOf(window), ['extensionSettings', 'saveSettingsDebounced']);
    if (reason)
        return unavailable(reason);
    const bucket = () => {
        const context = contextOf(window);
        if (!context?.extensionSettings || !isFunction(context.saveSettingsDebounced))
            throw new Error('Extension settings are no longer available.');
        const existing = context.extensionSettings[SETTINGS_KEY];
        const own = typeof existing === 'object' && existing !== null ? existing : {};
        context.extensionSettings[SETTINGS_KEY] = own;
        return { own, context };
    };
    return {
        available: true,
        async load(key) { return bucket().own[key]; },
        async save(key, value) { const { own, context } = bucket(); own[key] = value; context.saveSettingsDebounced(); },
    };
}
/** Stock SillyTavern: per-chat state in chat metadata, global settings in extension settings, everything else from the context. */
export function sillyTavernAdapter(window) {
    return {
        kind: 'sillytavern',
        chatIdentity: chatIdentity(window, sillyTavernBinding),
        perChatStorage: metadataStorage(window),
        globalStorage: settingsStorage(window),
        slashCommands: slashCommands(window),
        functionTools: functionTools(window),
        promptInjection: promptInjection(window),
        filePicker: domFilePicker(window),
        composer: domComposer(window),
        mountPoints: () => domMountPoints(window),
    };
}
