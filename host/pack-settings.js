import { errorMessage } from "../engine/errors.js";
import { resolveActivePack } from "../engine/pack-source.js";
import { validateTablePack } from "../engine/table-pack.js";
/** Global settings document (one per device): the imported pack lives in `tablePack`; other fields are preserved untouched. */
export const PACK_SETTINGS_KEY = 'settings-v1';
/** Resolves `dist/mythic-tables.json`, beside the built `index.js`; a missing file or no network is simply "no local file". */
export async function fetchLocalPackFile() {
    try {
        const response = await fetch(new URL('../mythic-tables.json', import.meta.url));
        return response.ok ? await response.json() : undefined;
    }
    catch {
        return undefined;
    }
}
/**
 * Owns the imported pack: reads it from global storage at startup, validates imports, persists them for every chat on
 * the device, and hands the active pack (imported → local file → fallback) to the controller.
 */
export class PackSettings {
    state;
    host;
    target;
    fetchLocalPack;
    changed;
    imported;
    localFile;
    constructor(host, target, options = {}) {
        this.host = host;
        this.target = target;
        this.fetchLocalPack = options.fetchLocalPack ?? fetchLocalPackFile;
        this.changed = options.changed ?? (() => { });
        const initial = resolveActivePack({});
        this.state = { source: initial.source, label: initial.pack.label, warnings: [], busy: false };
    }
    async load() {
        this.state = { ...this.state, busy: true };
        this.changed();
        this.imported = (await this.readSettings()).tablePack;
        this.localFile = await this.fetchLocalPack();
        this.activate();
    }
    /** A refused pack (bad JSON or failed validation) changes nothing: the active pack stays and the message is shown. */
    async importJson(text) {
        let raw;
        try {
            raw = JSON.parse(text);
        }
        catch (error) {
            this.refuse(`Not valid JSON: ${errorMessage(error)}`);
            return;
        }
        try {
            validateTablePack(raw);
        }
        catch (error) {
            this.refuse(errorMessage(error));
            return;
        }
        this.state = { ...this.state, busy: true, error: undefined };
        this.changed();
        this.imported = raw;
        await this.writeImported(raw);
        this.activate();
    }
    /** Drops the imported pack from this device; the next source in load order takes over. */
    async removeImported() {
        this.state = { ...this.state, busy: true, error: undefined };
        this.changed();
        this.imported = undefined;
        await this.writeImported(undefined);
        this.activate();
    }
    refuse(error) {
        this.state = { ...this.state, error };
        this.changed();
    }
    async writeImported(tablePack) {
        const storage = this.host.globalStorage;
        if (!storage.available)
            return;
        const { tablePack: _previous, ...rest } = await this.readSettings();
        await storage.save(PACK_SETTINGS_KEY, tablePack === undefined ? rest : { ...rest, tablePack });
    }
    sessionOnlyNotice() {
        const storage = this.host.globalStorage;
        return storage.available ? [] : [`Global storage unavailable (${storage.reason}): an imported pack lasts for this session only.`];
    }
    async readSettings() {
        const storage = this.host.globalStorage;
        if (!storage.available)
            return {};
        const saved = await storage.load(PACK_SETTINGS_KEY);
        return typeof saved === 'object' && saved !== null && !Array.isArray(saved) ? saved : {};
    }
    /** Re-resolves the active pack from the current candidates and tells the controller. */
    activate() {
        const active = resolveActivePack({ imported: this.imported, localFile: this.localFile });
        this.target.setPack(active.pack);
        this.state = { source: active.source, label: active.pack.label,
            warnings: [...active.warnings, ...this.sessionOnlyNotice()], busy: false };
        this.changed();
    }
}
