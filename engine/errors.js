/** The human-readable text of anything thrown: an Error's message, or the stringified value for non-Error throws. */
export function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
