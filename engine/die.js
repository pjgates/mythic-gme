const RANGE = 2 ** 32;
/** Web Crypto rejection sampling so no face is biased. */
export function die(sides) {
    if (!Number.isInteger(sides) || sides < 1 || sides > RANGE)
        throw new Error(`Cannot roll a d${sides}.`);
    const limit = Math.floor(RANGE / sides) * sides;
    const words = new Uint32Array(1);
    do {
        crypto.getRandomValues(words);
    } while (words[0] >= limit);
    return words[0] % sides + 1;
}
