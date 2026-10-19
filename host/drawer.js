import { CHAOS_MAX, CHAOS_MIN } from "../engine/chaos.js";
import { createAskBar } from "./ask-bar.js";
import { element } from "./card-shell.js";
import { createFeedSection } from "./feed-section.js";
import { createListsSection } from "./lists-section.js";
import { createLogSection } from "./log-section.js";
import { createPromptSection } from "./prompt-section.js";
import { createSceneSection } from "./scene-section.js";
import { createSettingsSection } from "./settings-section.js";
export const LAUNCHER_ID = 'mythic-gme-launch';
export const DRAWER_ID = 'mythic-gme-drawer';
const OVERRIDE_ID = 'mythic-gme-chaos-override';
/**
 * Builds the launcher and the drawer. The drawer is one column that reads as the open scene: a header with the Chaos
 * Factor and scene number, the scene strip, the feed of this scene's receipts, then the bookkeeping rows (lists, roll
 * log, AI prompt, settings) folded away, and the Ask bar pinned to the bottom edge. Layout (bottom sheet under 1024px,
 * docked panel above) is CSS-only. Nothing here reads state back out of the DOM.
 */
export function createDrawer(mountPoints, actions) {
    const launcher = document.createElement('button');
    launcher.id = LAUNCHER_ID;
    launcher.className = 'menu_button';
    launcher.type = 'button';
    launcher.textContent = 'Mythic';
    launcher.setAttribute('aria-controls', DRAWER_ID);
    launcher.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('aside');
    panel.id = DRAWER_ID;
    panel.hidden = true;
    panel.setAttribute('aria-labelledby', 'mythic-gme-title');
    panel.innerHTML = `<header class="mythic-gme-top">
    <div class="mythic-gme-chaos" role="group" aria-labelledby="mythic-gme-chaos-label">
      <button class="menu_button" type="button" data-decrease aria-label="Decrease Chaos Factor">−</button>
      <div class="mythic-gme-readout">
        <span id="mythic-gme-chaos-label">Chaos</span>
        <output data-chaos aria-live="polite" for="mythic-gme-chaos-label"></output>
      </div>
      <button class="menu_button" type="button" data-increase aria-label="Increase Chaos Factor">+</button>
    </div>
    <h2 id="mythic-gme-title" class="mythic-gme-title"><span class="mythic-gme-sr">Mythic GME, </span><span data-scene></span></h2>
    <button class="menu_button mythic-gme-close" type="button" data-close aria-label="Close Mythic">Close</button>
  </header>
  <div class="mythic-gme-body">
    <p class="mythic-gme-notice" data-notice hidden></p>
  </div>
  <p class="mythic-gme-status" role="status" aria-live="polite" data-status></p>`;
    const query = (selector) => panel.querySelector(selector);
    const body = query('.mythic-gme-body');
    const notice = query('[data-notice]');
    const status = query('[data-status]');
    const elements = {
        chaos: query('[data-chaos]'),
        scene: query('[data-scene]'),
        status,
        notice,
        increase: query('[data-increase]'),
        decrease: query('[data-decrease]'),
    };
    const close = query('[data-close]');
    const scene = createSceneSection(actions);
    const feed = createFeedSection(actions);
    const lists = createListsSection(actions);
    const log = createLogSection(actions);
    const prompt = createPromptSection(actions);
    const settings = createSettingsSection(actions);
    const override = chaosOverrideField();
    settings.element.append(override.field);
    const ask = createAskBar(actions, { chaosOverride: override.value });
    // Reading order: where the scene stands, what just happened, then the bookkeeping rows.
    body.prepend(scene.element);
    body.append(feed.element, fold('Adventure Lists', lists.element, 'lists'), log.element, fold('AI prompt', prompt.element, 'prompt'), settings.element);
    // Refusals and an unavailable chat are answered where the player acts, above the field, not up in the feed.
    ask.element.prepend(status);
    panel.append(ask.element);
    const sections = [scene, feed, lists, log];
    function mount() {
        const { composer, column } = mountPoints();
        if (composer && launcher.parentElement !== composer)
            composer.prepend(launcher);
        const home = column ?? document.body;
        if (panel.parentElement !== home)
            home.append(panel);
        launcher.setAttribute('aria-expanded', String(!panel.hidden));
    }
    function show() { panel.hidden = false; mount(); ask.settle(); close.focus(); }
    function hide() { panel.hidden = true; mount(); launcher.focus(); }
    function toggle() { if (panel.hidden)
        show();
    else
        hide(); }
    launcher.onclick = toggle;
    close.onclick = hide;
    elements.increase.onclick = () => actions.adjust(1);
    elements.decrease.onclick = () => actions.adjust(-1);
    panel.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            hide();
        }
    });
    return { launcher, panel, elements, sections, ask, prompt, settings, mount, show, hide, toggle };
}
/** A collapsed bookkeeping row with a 44px summary, matching the roll log and settings rows. */
function fold(title, content, name) {
    const details = element('details', 'mythic-gme-panel');
    details.dataset.fold = name;
    const summary = element('summary', '');
    summary.append(element('span', 'mythic-gme-fold-title', title));
    details.append(summary, content);
    return details;
}
/** Fate Checks use the saved Chaos Factor unless the player sets an override here; it is UI state, never saved. */
function chaosOverrideField() {
    const field = element('div', 'mythic-gme-field mythic-gme-override');
    const label = element('label', '', 'Chaos override for Fate Checks');
    label.htmlFor = OVERRIDE_ID;
    const input = element('input', 'text_pole');
    input.id = OVERRIDE_ID;
    input.type = 'number';
    input.min = String(CHAOS_MIN);
    input.max = String(CHAOS_MAX);
    input.inputMode = 'numeric';
    input.placeholder = 'saved Chaos Factor';
    input.dataset.chaosOverride = '';
    field.append(label, input);
    return {
        field,
        value() {
            const trimmed = input.value.trim();
            return trimmed === '' ? undefined : Number(trimmed);
        },
    };
}
