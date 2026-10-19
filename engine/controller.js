import { die as cryptoDie } from "./die.js";
import { newDocument, readDocument } from "./document.js";
import { errorMessage } from "./errors.js";
import { FALLBACK_PACK } from "./fallback-pack.js";
import { resolve, toReceipt } from "./operation.js";
export class MythicController {
    state = { binding: '', busy: false, available: false, status: 'Select a saved chat.' };
    host;
    die;
    changed;
    activePack;
    operations = new Map();
    writes = new Map();
    epoch = 0;
    constructor(host, options = {}) {
        this.host = host;
        this.die = options.die ?? cryptoDie;
        this.changed = options.changed ?? (() => { });
        this.activePack = options.pack ?? FALLBACK_PACK;
    }
    get pack() { return this.activePack; }
    /** Swaps the active pack for every later Meaning roll; recorded receipts keep the pack identity they were rolled with. */
    setPack(pack) {
        this.activePack = pack;
        this.changed();
    }
    async open(binding) {
        const epoch = ++this.epoch;
        this.state = { binding, busy: true, available: false, status: 'Opening Mythic state…' };
        this.changed();
        const storage = this.host.perChatStorage;
        if (!binding) {
            this.state = { binding, busy: false, available: false, status: 'Select a saved chat.' };
        }
        else if (!storage.available) {
            this.state = { binding, busy: false, available: false, status: `Per-chat storage unavailable: ${storage.reason}` };
        }
        else {
            try {
                await this.writes.get(binding)?.catch(() => { });
                if (epoch !== this.epoch)
                    return;
                const saved = await storage.load(binding);
                if (epoch !== this.epoch)
                    return;
                const document = saved === undefined ? newDocument(binding) : readDocument(saved, binding);
                this.state = { binding, document, busy: false, available: true,
                    status: saved === undefined ? 'New chat: Mythic state starts fresh.' : 'Saved Mythic state reopened.' };
            }
            catch (error) {
                if (epoch !== this.epoch)
                    return;
                this.state = { binding, busy: false, available: false, status: `Cannot open Mythic state: ${errorMessage(error)}` };
            }
        }
        this.changed();
    }
    submit(operation) {
        if (operation.binding !== this.state.binding)
            return Promise.reject(new Error('Operation belongs to another chat.'));
        const key = `${operation.binding}:${operation.operationId}`;
        const inFlight = this.operations.get(key);
        if (inFlight)
            return inFlight.then(toReceipt);
        const pending = this.resolveAndSave(structuredClone(operation));
        this.operations.set(key, pending);
        const clear = () => { this.operations.delete(key); };
        void pending.then(clear, clear);
        return pending.then(toReceipt);
    }
    async resolveAndSave(captured) {
        const { document } = this.state;
        if (!document)
            throw new Error('Operation belongs to another chat.');
        const recordedBefore = document.journal.find(entry => entry.operationId === captured.operationId);
        if (recordedBefore)
            return recordedBefore;
        if (!this.state.available || this.state.busy)
            throw new Error('Mythic state unavailable or saving.');
        if (captured.expectedRevision !== document.revision)
            throw new Error('Operation is stale; reopen its controls.');
        const { result, draws, state } = resolve(document, captured.body, this.die, { pack: this.activePack });
        const recorded = { operationId: captured.operationId, revision: document.revision + 1,
            at: new Date().toISOString(), caller: captured.caller, body: captured.body, draws, result,
            chaosFactor: state.chaosFactor, sceneCount: state.sceneCount };
        const next = { ...document, ...state, revision: recorded.revision, journal: [...document.journal, recorded] };
        await this.commit(next);
        return recorded;
    }
    async commit(document) {
        const storage = this.host.perChatStorage;
        if (!storage.available)
            throw new Error(`Per-chat storage unavailable: ${storage.reason}`);
        const epoch = this.epoch;
        const { binding } = document;
        this.state.busy = true;
        this.state.status = 'Saving Mythic state…';
        this.changed();
        try {
            const write = storage.save(binding, document);
            this.writes.set(binding, write);
            await write;
            if (epoch !== this.epoch)
                throw new Error('Chat changed; result saved to its original chat.');
            this.state.document = document;
            this.state.status = 'Mythic state saved.';
        }
        catch (error) {
            if (epoch === this.epoch) {
                this.state.available = false;
                this.state.status = `Save outcome uncertain; reopen before retrying: ${errorMessage(error)}`;
            }
            throw error;
        }
        finally {
            this.writes.delete(binding);
            if (epoch === this.epoch) {
                this.state.busy = false;
                this.changed();
            }
        }
    }
}
