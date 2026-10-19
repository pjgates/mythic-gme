import { chatText } from "./engine/chat-text.js";
import { MythicController } from "./engine/controller.js";
import { errorMessage } from "./engine/errors.js";
import { createAgentRun } from "./host/agent-run.js";
import { chaosCommand } from "./host/chaos-command.js";
import { createMythicApi } from "./host/api.js";
import { revealingSubmit } from "./host/command-submit.js";
import { registerMythicCommand } from "./host/commands.js";
import { createDrawer } from "./host/drawer.js";
import { drawerView, renderDrawer } from "./host/drawer-view.js";
import { fateCommand } from "./host/fate-command.js";
import { listCommand } from "./host/list-command.js";
import { meaningCommand } from "./host/meaning-command.js";
import { PackSettings } from "./host/pack-settings.js";
import { syncPrompt } from "./host/prompt-sync.js";
import { rollHandler } from "./host/roll-command.js";
import { endSceneCommand, sceneCommand } from "./host/scene-command.js";
import { awaitHostReady, selectHostAdapter } from "./host/select.js";
import { registerMythicTools } from "./host/tools.js";
const hostWindow = window;
await awaitHostReady(hostWindow);
const adapter = selectHostAdapter(hostWindow);
// A rejected operation (stale controls, chat changed mid-save, malformed dice) is shown once, until the next state change.
let transient;
// The prompt text last handed to the host, so the host is only called when the injected text actually changes.
let lastPrompt;
const controller = new MythicController(adapter, { changed: () => { transient = undefined; render(); mythic.notify(); } });
const settings = new PackSettings(adapter, controller, { changed: () => render() });
// Agent callers (function tools, window.MythicGME) share one runner that submits with caller 'agent'.
const run = createAgentRun(controller);
const mythic = createMythicApi(controller, run);
hostWindow.MythicGME = mythic.api;
registerMythicTools(adapter, run);
const filePicker = adapter.filePicker;
const composer = adapter.composer;
const drawer = createDrawer(adapter.mountPoints, {
    adjust: delta => attempt({ kind: 'adjust-chaos', delta }),
    roll: expression => attempt({ kind: 'dice', expression }),
    fate: request => attempt({ kind: 'fate', ...request }),
    meaning: (table, question) => attempt(question === undefined ? { kind: 'meaning', table } : { kind: 'meaning', table, question }),
    meaningFor: (parentOperationId, table) => attempt({ kind: 'meaning', table, parentOperationId }),
    add: (list, name) => attempt({ kind: 'list', list, action: { kind: 'add', name } }),
    scene: request => attempt({ kind: 'scene-check', ...request }),
    endScene: control => attempt({ kind: 'end-scene', control }),
    note: (about, text) => attempt({ kind: 'note', about, text }),
    toChat: composer.available ? (receipt, note) => { composer.insert(chatText(receipt, note)); } : undefined,
    list: (list, action) => attempt({ kind: 'list', list, action }),
    clearLog: () => attempt({ kind: 'clear-log' }),
    setPromptInjection: enabled => attempt({ kind: 'set-prompt-injection', enabled }),
    acknowledge: () => attempt({ kind: 'acknowledge' }),
    importPack: text => { void settings.importJson(text); },
    removeImportedPack: () => { void settings.removeImported(); },
    pickPackFile: filePicker.available ? () => filePicker.pickText() : undefined,
});
// Slash commands answer in chat and open the drawer on the new card (spec: "open the matching receipt").
const reveal = revealingSubmit(submit, drawer);
registerMythicCommand(adapter, {
    roll: rollHandler(expression => reveal({ kind: 'dice', expression })),
    fate: fateCommand(request => reveal({ kind: 'fate', ...request })),
    meaning: meaningCommand(table => reveal({ kind: 'meaning', table }), () => controller.pack),
    list: listCommand(reveal),
    scene: sceneCommand(request => reveal({ kind: 'scene-check', ...request })),
    'end-scene': endSceneCommand(control => reveal({ kind: 'end-scene', control })),
    chaos: chaosCommand(delta => reveal({ kind: 'adjust-chaos', delta })),
});
function render() {
    // The status line carries refusals and an unavailable chat; routine open/save confirmations are chatter next to a
    // feed that already shows the result, and a busy flash would shift the Ask bar on every tap.
    const quiet = controller.state.available || controller.state.busy;
    const state = { ...controller.state, status: transient ?? (quiet ? '' : controller.state.status) };
    renderDrawer(drawer.elements, drawerView(state, adapter));
    for (const section of drawer.sections)
        section.render(state);
    drawer.ask.render(state, controller.pack);
    drawer.prompt.render(state, adapter.promptInjection);
    drawer.settings.render(settings.state);
    // Computed from controller state, so opening another chat (which drops the document) clears the prompt at once.
    lastPrompt = syncPrompt(adapter, controller.state.document, lastPrompt);
}
/** Every human-triggered roll or change goes through the controller as one operation on the open chat. */
function submit(body) {
    const { binding, document, status } = controller.state;
    if (!document)
        return Promise.reject(new Error(status));
    return controller.submit({ operationId: crypto.randomUUID(), binding, expectedRevision: document.revision, caller: 'human', body });
}
/**
 * Drawer controls report a refusal in the status line; the controller's own status wins once it marks the chat
 * unavailable. The returned promise settles either way, so a caller adding several entries can go one at a time.
 */
function attempt(body) {
    return submit(body).catch((error) => {
        if (controller.state.available) {
            transient = errorMessage(error);
            render();
        }
        return undefined;
    });
}
async function reopen() {
    const identity = adapter.chatIdentity;
    const binding = identity.available ? await identity.current() : undefined;
    await controller.open(binding ?? '');
}
drawer.mount();
render();
if (adapter.chatIdentity.available)
    adapter.chatIdentity.onChange(() => { void reopen(); });
await settings.load();
await reopen();
