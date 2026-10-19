import { describePackSource } from "../engine/pack-source.js";
import { element } from "./card-shell.js";
const TEXTAREA_ID = 'mythic-gme-pack-json';
/**
 * Collapsible Settings: the active pack and its source, a paste field for pack JSON (every host), a file picker where
 * the host has one, and removal of the imported pack. Renders from PackSettings state, never from the DOM.
 */
export function createSettingsSection(actions) {
    const details = element('details', 'mythic-gme-panel mythic-gme-settings');
    const summary = element('summary', 'mythic-gme-settings-title', 'Settings');
    const packLine = element('p', 'mythic-gme-pack');
    packLine.dataset.pack = '';
    const form = element('form', 'mythic-gme-pack-import');
    const label = element('label', 'mythic-gme-settings-label', 'Table pack JSON');
    label.htmlFor = TEXTAREA_ID;
    const textarea = element('textarea', 'text_pole');
    textarea.id = TEXTAREA_ID;
    textarea.rows = 4;
    textarea.spellcheck = false;
    textarea.placeholder = 'Paste the JSON of your table pack here';
    const buttons = element('div', 'mythic-gme-settings-buttons');
    const importButton = element('button', 'menu_button', 'Import');
    importButton.type = 'submit';
    buttons.append(importButton);
    const pickFile = actions.pickPackFile;
    if (pickFile) {
        const pickButton = element('button', 'menu_button', 'Pick file');
        pickButton.type = 'button';
        pickButton.dataset.pickFile = '';
        pickButton.onclick = async () => {
            const text = await pickFile();
            if (text !== undefined)
                submit(text);
        };
        buttons.append(pickButton);
    }
    const remove = element('button', 'menu_button mythic-gme-danger', 'Remove imported pack');
    remove.type = 'button';
    remove.dataset.removeImported = '';
    remove.hidden = true;
    remove.onclick = () => actions.removeImportedPack();
    buttons.append(remove);
    const status = element('p', 'mythic-gme-settings-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.dataset.settingsStatus = '';
    form.append(label, textarea, buttons);
    details.append(summary, packLine, form, status);
    // The paste is kept until an import succeeds, so a refused pack can be corrected rather than re-pasted.
    let awaitingOutcome = false;
    function submit(text) {
        awaitingOutcome = true;
        actions.importPack(text);
    }
    form.addEventListener('submit', event => {
        event.preventDefault();
        const text = textarea.value.trim();
        if (text !== '')
            submit(text);
    });
    function render(state) {
        const line = `Tables: ${state.label} — ${describePackSource(state.source)}`;
        if (packLine.textContent !== line)
            packLine.textContent = line;
        const message = state.error ?? state.warnings.join(' ');
        if (status.textContent !== message)
            status.textContent = message;
        status.classList.toggle('mythic-gme-settings-error', state.error !== undefined);
        importButton.disabled = state.busy;
        remove.disabled = state.busy;
        remove.hidden = state.source !== 'imported';
        for (const control of details.querySelectorAll('[data-pick-file]'))
            control.disabled = state.busy;
        if (awaitingOutcome && !state.busy) {
            awaitingOutcome = false;
            if (state.error === undefined)
                textarea.value = '';
        }
    }
    return { element: details, render };
}
