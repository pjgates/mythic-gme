import { unavailable } from "./adapter.js";
import { chatIdentity, domComposer, domFilePicker, domMountPoints, functionTools, promptInjection, slashCommands } from "./context-capabilities.js";
import { isFunction } from "./globals.js";
/** Dedicated namespace: never read or write under any other extension's namespace. */
export const NAMESPACE = 'mythic-gme';
export const DOCUMENT_SUFFIX = '-v1';
export const SETTINGS_PREFIX = 'settings-v1';
export function tauriTavernApi(window) {
    return window.__TAURITAVERN__?.api;
}
export function hasTauriTavern(window) {
    return typeof window.__TAURITAVERN__ === 'object' && window.__TAURITAVERN__ !== null;
}
export async function documentKey(binding) {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(binding));
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('') + DOCUMENT_SUFFIX;
}
function usableStore(api) {
    const store = api?.extension?.store;
    if (!store)
        return 'TauriTavern api.extension.store is not available.';
    const absent = ['tryGetJson', 'setJson'].filter(name => !isFunction(store[name]));
    return absent.length ? `TauriTavern extension store is missing ${absent.join(', ')}.` : store;
}
export function tauriTavernBinding(api) {
    const handle = api.chat?.current?.handle?.();
    if (!handle)
        return undefined;
    // An unsaved chat has no stable id yet; treat it as "select a saved chat first".
    return handle.stableId().then(id => id ? `${handle.ref.kind}:${id}` : undefined);
}
export function extensionStoreStorage(window) {
    const store = usableStore(tauriTavernApi(window));
    if (typeof store === 'string')
        return unavailable(store);
    return {
        available: true,
        async load(binding) {
            const result = await store.tryGetJson({ namespace: NAMESPACE, key: await documentKey(binding) });
            return result.found ? result.value : undefined;
        },
        async save(binding, document) {
            await store.setJson({ namespace: NAMESPACE, key: await documentKey(binding), value: document });
        },
    };
}
export function extensionStoreSettings(window) {
    const store = usableStore(tauriTavernApi(window));
    if (typeof store === 'string')
        return unavailable(store);
    // The settings document itself lives at the bare `settings-v1` file; any other key is a sibling file under the prefix.
    const keyFor = (key) => key === '' || key === SETTINGS_PREFIX ? SETTINGS_PREFIX : `${SETTINGS_PREFIX}-${key}`;
    return {
        available: true,
        async load(key) {
            const result = await store.tryGetJson({ namespace: NAMESPACE, key: keyFor(key) });
            return result.found ? result.value : undefined;
        },
        async save(key, value) { await store.setJson({ namespace: NAMESPACE, key: keyFor(key), value }); },
    };
}
export function tauriTavernAdapter(window) {
    const api = tauriTavernApi(window);
    const identity = isFunction(api?.chat?.current?.handle)
        ? chatIdentity(window, () => tauriTavernBinding(api))
        : unavailable('TauriTavern api.chat.current.handle is not available.');
    return {
        kind: 'tauritavern',
        chatIdentity: identity,
        perChatStorage: extensionStoreStorage(window),
        globalStorage: extensionStoreSettings(window),
        slashCommands: slashCommands(window),
        functionTools: functionTools(window),
        promptInjection: promptInjection(window),
        filePicker: domFilePicker(window),
        composer: domComposer(window),
        mountPoints: () => domMountPoints(window),
    };
}
