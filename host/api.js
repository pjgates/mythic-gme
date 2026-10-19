import { entriesOf } from "../engine/lists.js";
import { visibleLog } from "../engine/log.js";
export const API_VERSION = '0.1.0';
/** `notify` is for the entry point to call from the controller's change hook; the API object itself stays read-only. */
export function createMythicApi(controller, run) {
    const listeners = new Set();
    const state = () => {
        const { binding, document, available } = controller.state;
        if (!document)
            return undefined;
        return { binding, chaosFactor: document.chaosFactor, sceneCount: document.sceneCount, available,
            lists: { characters: entriesOf(document.lists.characters), threads: entriesOf(document.lists.threads) } };
    };
    const api = {
        version: API_VERSION,
        state,
        submit: (kind, args) => run(kind, args),
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        receipts() {
            const { document } = controller.state;
            return document ? visibleLog(document) : [];
        },
    };
    // A broken subscriber must not break the drawer or the controller, so each listener is isolated.
    const notify = () => {
        const snapshot = state();
        for (const listener of listeners) {
            try {
                listener(snapshot);
            }
            catch (error) {
                console.error('MythicGME subscriber failed:', error);
            }
        }
    };
    return { api, notify };
}
