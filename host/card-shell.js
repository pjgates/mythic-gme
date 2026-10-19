/** Shared chrome: title, who rolled, when; feature modules supply the body. */
export function cardShell(receipt, title, ...body) {
    const card = element('article', 'mythic-gme-card');
    card.setAttribute('data-kind', receipt.result.kind);
    card.setAttribute('data-operation', receipt.operationId);
    const header = element('header', 'mythic-gme-card-header');
    const when = document.createElement('time');
    when.dateTime = receipt.at;
    when.textContent = new Date(receipt.at).toLocaleTimeString();
    header.append(element('strong', 'mythic-gme-card-title', title), when);
    markCaller(card, header, receipt);
    card.append(header, ...body);
    return card;
}
export const GM_ROLLED_LABEL = 'GM-rolled';
/**
 * The one place that marks who rolled: `data-caller` on the container and, for agent callers, a visible GM-rolled
 * badge appended to `header`. Every card kind and the roll log line go through here so the audit marker cannot drift.
 */
export function markCaller(container, header, receipt) {
    container.setAttribute('data-caller', receipt.caller);
    if (receipt.caller !== 'agent')
        return;
    const badge = element('span', 'mythic-gme-badge mythic-gme-badge-muted mythic-gme-gm-rolled', GM_ROLLED_LABEL);
    badge.setAttribute('title', 'Rolled by the AI GM through a function tool or the MythicGME API');
    header.append(badge);
}
export function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
