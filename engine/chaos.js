/** The Chaos Factor runs 1–9 and a new adventure starts at 5 (Mythic GME 2e). Every bound check goes through here. */
export const CHAOS_MIN = 1;
export const CHAOS_MAX = 9;
export const STARTING_CHAOS_FACTOR = 5;
export function clampChaos(value) {
    return Math.min(CHAOS_MAX, Math.max(CHAOS_MIN, value));
}
export function isChaosFactor(value) {
    return Number.isInteger(value) && value >= CHAOS_MIN && value <= CHAOS_MAX;
}
