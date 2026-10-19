import { CAPABILITY_NAMES, unavailable } from "./adapter.js";
import { domComposer, domFilePicker, domMountPoints } from "./context-capabilities.js";
import { sillyTavernAdapter } from "./sillytavern.js";
import { hasTauriTavern, tauriTavernAdapter } from "./tauritavern.js";
/** Wait for whichever host readiness signal exists before touching native APIs. */
export async function awaitHostReady(window) {
    await (window.__TAURITAVERN__?.ready ?? window.__TAURITAVERN_MAIN_READY__);
}
function noHostAdapter(window) {
    const reason = 'Neither TauriTavern nor SillyTavern host globals were found.';
    const adapter = { kind: 'none', mountPoints: () => domMountPoints(window) };
    for (const name of CAPABILITY_NAMES)
        adapter[name] = unavailable(reason);
    adapter.filePicker = domFilePicker(window);
    adapter.composer = domComposer(window);
    return adapter;
}
/** TauriTavern when its native API is present; stock SillyTavern otherwise. */
export function selectHostAdapter(window) {
    if (hasTauriTavern(window))
        return tauriTavernAdapter(window);
    if (window.SillyTavern)
        return sillyTavernAdapter(window);
    return noHostAdapter(window);
}
