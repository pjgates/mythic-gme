import { CHAOS_MAX, CHAOS_MIN } from "../engine/chaos.js";
import { CAPABILITY_NAMES } from "./adapter.js";
const LABELS = {
    chatIdentity: 'Chat identity',
    perChatStorage: 'Per-chat storage',
    globalStorage: 'Global storage',
    slashCommands: 'Slash commands',
    functionTools: 'Function tools',
    promptInjection: 'Prompt injection',
    filePicker: 'File picker',
    composer: 'Chat composer',
};
/** Everything the drawer shows comes from controller state and reported capabilities, never from the DOM. */
export function drawerView(state, capabilities) {
    const document = state.document;
    const interactive = state.available && !state.busy && !!document;
    const unavailable = CAPABILITY_NAMES.flatMap(name => {
        const capability = capabilities[name];
        return capability.available ? [] : [{ name, label: LABELS[name], reason: capability.reason }];
    });
    return {
        chaosFactor: document ? String(document.chaosFactor) : '–',
        scene: document ? `Scene ${document.sceneCount}` : 'No chat',
        status: state.status,
        canIncrease: interactive && document.chaosFactor < CHAOS_MAX,
        canDecrease: interactive && document.chaosFactor > CHAOS_MIN,
        unavailable,
        notice: unavailable.length
            ? `Unavailable on this host: ${unavailable.map(entry => `${entry.label} (${entry.reason})`).join('; ')}`
            : '',
    };
}
export function renderDrawer(elements, view) {
    setText(elements.chaos, view.chaosFactor);
    setText(elements.scene, view.scene);
    setText(elements.status, view.status);
    setText(elements.notice, view.notice);
    elements.notice.hidden = view.notice === '';
    elements.increase.disabled = !view.canIncrease;
    elements.decrease.disabled = !view.canDecrease;
}
function setText(element, text) {
    if (element.textContent !== text)
        element.textContent = text;
}
