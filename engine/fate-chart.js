// WORKING TRANSCRIPTION — awaiting Peter's confirmation against Mythic GME 2e pp. 18–24; only fifty-fifty@5 is confirmed.
// Data only: swapping in confirmed values is a change to this table and to test/fixtures/fate-chart.json.
/** 0 marks a cell where Exceptional Yes cannot happen; 101 marks one where Exceptional No cannot happen. */
export const NO_EXCEPTIONAL_YES = 0;
export const NO_EXCEPTIONAL_NO = 101;
export const ODDS = [
    { id: 'certain', label: 'Certain' },
    { id: 'nearly-certain', label: 'Nearly Certain' },
    { id: 'very-likely', label: 'Very Likely' },
    { id: 'likely', label: 'Likely' },
    { id: 'fifty-fifty', label: '50/50' },
    { id: 'unlikely', label: 'Unlikely' },
    { id: 'very-unlikely', label: 'Very Unlikely' },
    { id: 'nearly-impossible', label: 'Nearly Impossible' },
    { id: 'impossible', label: 'Impossible' },
];
export function isOddsId(value) {
    return ODDS.some(odds => odds.id === value);
}
export function oddsLabel(odds) {
    return ODDS.find(entry => entry.id === odds).label;
}
/** Rows are odds levels; each row holds the cells for Chaos Factor 1 through 9 in order. */
export const FATE_CHART = {
    'certain': [
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
        { exceptionalYes: 15, yes: 75, exceptionalNo: 96 },
        { exceptionalYes: 17, yes: 85, exceptionalNo: 98 },
        { exceptionalYes: 18, yes: 90, exceptionalNo: 99 },
        { exceptionalYes: 19, yes: 95, exceptionalNo: 100 },
        { exceptionalYes: 19, yes: 99, exceptionalNo: 101 },
        { exceptionalYes: 19, yes: 99, exceptionalNo: 101 },
        { exceptionalYes: 19, yes: 99, exceptionalNo: 101 },
    ],
    'nearly-certain': [
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
        { exceptionalYes: 15, yes: 75, exceptionalNo: 96 },
        { exceptionalYes: 17, yes: 85, exceptionalNo: 98 },
        { exceptionalYes: 18, yes: 90, exceptionalNo: 99 },
        { exceptionalYes: 19, yes: 95, exceptionalNo: 100 },
        { exceptionalYes: 19, yes: 99, exceptionalNo: 101 },
        { exceptionalYes: 19, yes: 99, exceptionalNo: 101 },
    ],
    'very-likely': [
        { exceptionalYes: 5, yes: 25, exceptionalNo: 86 },
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
        { exceptionalYes: 15, yes: 75, exceptionalNo: 96 },
        { exceptionalYes: 17, yes: 85, exceptionalNo: 98 },
        { exceptionalYes: 18, yes: 90, exceptionalNo: 99 },
        { exceptionalYes: 19, yes: 95, exceptionalNo: 100 },
        { exceptionalYes: 19, yes: 99, exceptionalNo: 101 },
    ],
    'likely': [
        { exceptionalYes: 3, yes: 15, exceptionalNo: 84 },
        { exceptionalYes: 5, yes: 25, exceptionalNo: 86 },
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
        { exceptionalYes: 15, yes: 75, exceptionalNo: 96 },
        { exceptionalYes: 17, yes: 85, exceptionalNo: 98 },
        { exceptionalYes: 18, yes: 90, exceptionalNo: 99 },
        { exceptionalYes: 19, yes: 95, exceptionalNo: 100 },
    ],
    'fifty-fifty': [
        { exceptionalYes: 2, yes: 10, exceptionalNo: 83 },
        { exceptionalYes: 3, yes: 15, exceptionalNo: 84 },
        { exceptionalYes: 5, yes: 25, exceptionalNo: 86 },
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
        { exceptionalYes: 15, yes: 75, exceptionalNo: 96 },
        { exceptionalYes: 17, yes: 85, exceptionalNo: 98 },
        { exceptionalYes: 18, yes: 90, exceptionalNo: 99 },
    ],
    'unlikely': [
        { exceptionalYes: 1, yes: 5, exceptionalNo: 82 },
        { exceptionalYes: 2, yes: 10, exceptionalNo: 83 },
        { exceptionalYes: 3, yes: 15, exceptionalNo: 84 },
        { exceptionalYes: 5, yes: 25, exceptionalNo: 86 },
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
        { exceptionalYes: 15, yes: 75, exceptionalNo: 96 },
        { exceptionalYes: 17, yes: 85, exceptionalNo: 98 },
    ],
    'very-unlikely': [
        { exceptionalYes: 0, yes: 1, exceptionalNo: 81 },
        { exceptionalYes: 1, yes: 5, exceptionalNo: 82 },
        { exceptionalYes: 2, yes: 10, exceptionalNo: 83 },
        { exceptionalYes: 3, yes: 15, exceptionalNo: 84 },
        { exceptionalYes: 5, yes: 25, exceptionalNo: 86 },
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
        { exceptionalYes: 15, yes: 75, exceptionalNo: 96 },
    ],
    'nearly-impossible': [
        { exceptionalYes: 0, yes: 1, exceptionalNo: 81 },
        { exceptionalYes: 0, yes: 1, exceptionalNo: 81 },
        { exceptionalYes: 1, yes: 5, exceptionalNo: 82 },
        { exceptionalYes: 2, yes: 10, exceptionalNo: 83 },
        { exceptionalYes: 3, yes: 15, exceptionalNo: 84 },
        { exceptionalYes: 5, yes: 25, exceptionalNo: 86 },
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
        { exceptionalYes: 13, yes: 65, exceptionalNo: 94 },
    ],
    'impossible': [
        { exceptionalYes: 0, yes: 1, exceptionalNo: 81 },
        { exceptionalYes: 0, yes: 1, exceptionalNo: 81 },
        { exceptionalYes: 0, yes: 1, exceptionalNo: 81 },
        { exceptionalYes: 1, yes: 5, exceptionalNo: 82 },
        { exceptionalYes: 2, yes: 10, exceptionalNo: 83 },
        { exceptionalYes: 3, yes: 15, exceptionalNo: 84 },
        { exceptionalYes: 5, yes: 25, exceptionalNo: 86 },
        { exceptionalYes: 7, yes: 35, exceptionalNo: 88 },
        { exceptionalYes: 10, yes: 50, exceptionalNo: 91 },
    ],
};
export function fateChartCell(odds, chaos) {
    if (!isOddsId(odds))
        throw new Error(`Unknown odds "${String(odds)}".`);
    if (!Number.isInteger(chaos) || chaos < 1 || chaos > 9)
        throw new Error(`Chaos Factor must be 1–9, got ${String(chaos)}.`);
    return FATE_CHART[odds][chaos - 1];
}
