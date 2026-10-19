/** `/mythic roll <expression>`: the whole rest of the line is the dice expression; the summary is the return value. */
export function rollHandler(roll) {
    return async (_named, rest) => (await roll(rest)).summary;
}
