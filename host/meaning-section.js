import { cardShell, element } from "./card-shell.js";
/** Table in the title, the word pair prominent, the question when one was asked, then the two d100 draws and the pack. */
export function renderMeaningCard(receipt) {
    const { result } = receipt;
    const body = [element('p', 'mythic-gme-words', `${result.words[0]} / ${result.words[1]}`)];
    if (result.question !== undefined)
        body.push(element('p', 'mythic-gme-question', result.question));
    body.push(element('p', 'mythic-gme-meta', `d100: ${result.draws[0]}, ${result.draws[1]} · pack: ${result.packLabel}`));
    return cardShell(receipt, `Meaning (${result.tableLabel})`, ...body);
}
