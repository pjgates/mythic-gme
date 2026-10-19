export const MAX_DICE = 100;
export const MAX_SIDES = 1000;
const GRAMMAR_HINT = 'expected NdX such as 2d6, 4d6kh3+2, d100 or 4dF';
/** Validates the whole expression before any die is drawn; the error names the first problem found. */
export function parseDice(text) {
    const source = text.replace(/\s+/g, '');
    if (!source)
        throw new Error(`Dice expression is empty; ${GRAMMAR_HINT}.`);
    const head = /^(\d*)d(\d+|f)?(.*)$/i.exec(source);
    if (!head)
        throw new Error(`Cannot read dice expression '${source}'; ${GRAMMAR_HINT}.`);
    const [, countText, sidesText, tail] = head;
    if (sidesText === undefined)
        throw new Error(`Missing die size after 'd' in '${source}'; ${GRAMMAR_HINT}.`);
    const count = countText === '' ? 1 : Number(countText);
    const sides = /f/i.test(sidesText) ? 'F' : Number(sidesText);
    if (count < 1)
        throw new Error('Dice count must be at least 1.');
    if (count > MAX_DICE)
        throw new Error(`At most ${MAX_DICE} dice per roll.`);
    if (sides !== 'F' && sides < 2)
        throw new Error('Dice need at least 2 sides.');
    if (sides !== 'F' && sides > MAX_SIDES)
        throw new Error(`Dice can have at most ${MAX_SIDES} sides.`);
    let rest = tail;
    let keep;
    const keepMatch = /^k([hl])(\d*)/i.exec(rest);
    if (keepMatch) {
        const [, which, keepText] = keepMatch;
        if (keepText === '')
            throw new Error(`Missing count after '${keepMatch[0]}' in '${source}'.`);
        const keepCount = Number(keepText);
        if (keepCount < 1)
            throw new Error('Keep count must be at least 1.');
        if (keepCount > count)
            throw new Error(`Cannot keep ${keepCount} of ${count} dice.`);
        keep = { mode: which.toLowerCase() === 'h' ? 'highest' : 'lowest', count: keepCount };
        rest = rest.slice(keepMatch[0].length);
    }
    let modifier = 0;
    const modifierMatch = /^([+-])(\d*)/.exec(rest);
    if (modifierMatch) {
        const [, sign, modifierText] = modifierMatch;
        if (modifierText === '')
            throw new Error(`Modifier after '${sign}' needs a number in '${source}'.`);
        modifier = (sign === '-' ? -1 : 1) * Number(modifierText);
        rest = rest.slice(modifierMatch[0].length);
    }
    if (rest !== '')
        throw new Error(`Unexpected '${rest}' in '${source}'; ${GRAMMAR_HINT}.`);
    return keep ? { count, sides, keep, modifier } : { count, sides, modifier };
}
export function formatDice({ count, sides, keep, modifier }) {
    const keepText = keep ? `k${keep.mode === 'highest' ? 'h' : 'l'}${keep.count}` : '';
    return `${count}d${sides}${keepText}${formatModifier(modifier)}`;
}
export function formatModifier(modifier) {
    if (modifier === 0)
        return '';
    return modifier > 0 ? `+${modifier}` : `${modifier}`;
}
function split(draws, keep) {
    if (!keep)
        return { kept: [...draws], dropped: [] };
    const ordered = [...draws].sort((a, b) => keep.mode === 'highest' ? b - a : a - b);
    return { kept: ordered.slice(0, keep.count), dropped: ordered.slice(keep.count) };
}
const FUDGE_FACES = 3;
function draw(sides, die) {
    return sides === 'F' ? die(FUDGE_FACES) - 2 : die(sides);
}
export function resolveDice(state, body, die) {
    const expression = parseDice(body.expression);
    const draws = Array.from({ length: expression.count }, () => draw(expression.sides, die));
    const { kept, dropped } = split(draws, expression.keep);
    const total = kept.reduce((sum, value) => sum + value, 0) + expression.modifier;
    const result = { kind: 'dice', expression: formatDice(expression), count: expression.count,
        sides: expression.sides, draws, kept, dropped, modifier: expression.modifier, total };
    if (expression.keep)
        result.keep = expression.keep;
    return { result, draws, state };
}
/**
 * Which draw, in roll order, counts towards the total. Equal faces are indistinguishable, so with `[3, 3, 1, 3]`
 * kept-highest-2 the first two 3s are marked, deterministically.
 */
export function keptFlags(result) {
    const remaining = [...result.kept];
    return result.draws.map(value => {
        const index = remaining.indexOf(value);
        if (index === -1)
            return false;
        remaining.splice(index, 1);
        return true;
    });
}
export function projectDice({ expression, draws, kept, modifier, total }) {
    return { expression, draws, kept, modifier, total };
}
/** Faces as the player reads them: plain for numbered dice, signed for Fudge dice. */
export function formatFace(result, value) {
    return result.sides === 'F' && value > 0 ? `+${value}` : `${value}`;
}
export function summarizeDice(result) {
    const faces = (values) => values.map(value => formatFace(result, value)).join(', ');
    const dice = result.dropped.length ? `${faces(result.kept)} | ${faces(result.dropped)}` : faces(result.kept);
    const modifier = result.modifier === 0 ? '' : ` ${formatModifier(result.modifier)}`;
    return `${result.expression}: [${dice}]${modifier} = ${result.total}`;
}
