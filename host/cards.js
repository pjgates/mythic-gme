import { SCENE_NOTE } from "../engine/note.js";
import { cardShell, element } from "./card-shell.js";
import { renderDiceCard } from "./dice-card.js";
import { renderFateCard } from "./fate-section.js";
import { renderListCard } from "./lists-section.js";
import { renderClearLogCard } from "./log-section.js";
import { renderMeaningCard } from "./meaning-section.js";
import { renderAcknowledgeCard, renderPromptInjectionCard } from "./prompt-section.js";
import { renderEndSceneCard, renderSceneCard } from "./scene-section.js";
/**
 * Every card is built from the saved receipt alone, never from other DOM state. `actions` lets a Fate or Scene card
 * with a Random Event offer "Roll another Meaning pair"; a bare render (roll log, audit) shows the chain alone.
 */
export function renderCard(receipt, actions) {
    const { result } = receipt;
    switch (result.kind) {
        case 'adjust-chaos': return renderChaosCard(receipt);
        case 'dice': return renderDiceCard(receipt);
        case 'fate': return renderFateCard(receipt, actions);
        case 'meaning': return renderMeaningCard(receipt);
        case 'list': return renderListCard(receipt);
        case 'clear-log': return renderClearLogCard(receipt);
        case 'scene-check': return renderSceneCard(receipt, actions);
        case 'end-scene': return renderEndSceneCard(receipt);
        case 'set-prompt-injection': return renderPromptInjectionCard(receipt);
        case 'acknowledge': return renderAcknowledgeCard(receipt);
        case 'note': return renderNoteCard(receipt);
        default: {
            const exhaustive = result;
            throw new Error(`Unknown result kind: ${String(exhaustive)}`);
        }
    }
}
export function renderChaosCard(receipt) {
    return cardShell(receipt, 'Chaos Factor', element('p', 'mythic-gme-card-summary', receipt.summary));
}
/** Notes appear here only in the roll log; the feed folds them under the receipt they interpret. */
export function renderNoteCard(receipt) {
    const { about, text } = receipt.result;
    const title = about === SCENE_NOTE ? 'Expected scene' : 'Note';
    return cardShell(receipt, title, element('p', 'mythic-gme-card-summary', text === '' ? `${title} cleared.` : text));
}
