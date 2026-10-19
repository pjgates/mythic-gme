import { injectableReceipts } from "../engine/prompt.js";
import { cardShell, element } from "./card-shell.js";
import { isInteractive } from "./section-helpers.js";
/**
 * Per-chat prompt injection: the toggle, Acknowledge rolls, and a one-line preview of what the narrator currently
 * gets. Renders separately from the other sections because it also needs the host's prompt capability, whose absence
 * disables the toggle and shows the reason; the saved toggle itself is still displayed.
 */
export function createPromptSection(actions) {
    const section = element('section', 'mythic-gme-prompt');
    section.setAttribute('aria-labelledby', 'mythic-gme-prompt-title');
    const title = element('h3', '', 'AI prompt');
    title.id = 'mythic-gme-prompt-title';
    const label = element('label', 'mythic-gme-prompt-toggle');
    const toggle = element('input', '');
    toggle.type = 'checkbox';
    toggle.dataset.promptToggle = '';
    label.append(toggle, element('span', '', 'Include recent manual rolls in AI prompt'));
    const reason = element('p', 'mythic-gme-prompt-reason');
    reason.dataset.promptReason = '';
    reason.hidden = true;
    const preview = element('p', 'mythic-gme-prompt-preview');
    preview.dataset.promptPreview = '';
    preview.setAttribute('aria-live', 'polite');
    const acknowledge = element('button', 'menu_button mythic-gme-acknowledge', 'Acknowledge rolls');
    acknowledge.type = 'button';
    acknowledge.dataset.acknowledge = '';
    section.append(title, label, reason, preview, acknowledge);
    toggle.onchange = () => actions.setPromptInjection(toggle.checked);
    acknowledge.onclick = () => actions.acknowledge();
    function render(state, injection) {
        const { document } = state;
        const interactive = isInteractive(state);
        const enabled = document?.promptInjection ?? false;
        const count = document ? injectableReceipts(document).length : 0;
        // The checkbox is left alone while a toggle operation is saving, so the tap is not undone before it lands.
        if (!state.busy)
            toggle.checked = enabled;
        toggle.disabled = !interactive || !injection.available;
        reason.hidden = injection.available;
        reason.textContent = injection.available ? '' : `Prompt injection unavailable on this host: ${injection.reason}`;
        preview.textContent = previewText(enabled, count);
        acknowledge.disabled = !interactive || count === 0;
    }
    return { element: section, render };
}
function previewText(enabled, count) {
    if (!enabled)
        return 'Off: nothing is added to the prompt.';
    if (count === 0)
        return 'On: nothing to add yet.';
    return `On: ${count} ${count === 1 ? 'roll' : 'rolls'} added to the prompt.`;
}
export function renderPromptInjectionCard(receipt) {
    return cardShell(receipt, 'AI prompt', element('p', 'mythic-gme-card-summary', receipt.summary));
}
export function renderAcknowledgeCard(receipt) {
    return cardShell(receipt, 'Acknowledged', element('p', 'mythic-gme-card-summary', receipt.summary));
}
