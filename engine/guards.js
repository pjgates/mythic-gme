/** A plain object (not null, not an array): the shape every persisted document, pack and agent argument must have. */
export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
