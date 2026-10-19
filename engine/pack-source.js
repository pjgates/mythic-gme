import { errorMessage } from "./errors.js";
import { FALLBACK_PACK } from "./fallback-pack.js";
import { validateTablePack } from "./table-pack.js";
export function describePackSource(source) {
    switch (source) {
        case 'imported': return 'imported';
        case 'local-file': return 'local file';
        case 'fallback': return 'fallback in use';
        default: {
            const exhaustive = source;
            return exhaustive;
        }
    }
}
/**
 * Validates each candidate in load order; an invalid one is skipped with a warning naming the source and the
 * validator's message (which already names the offending table and index). The fallback always validates.
 */
export function resolveActivePack(candidates) {
    const warnings = [];
    const ordered = [['imported', candidates.imported], ['local-file', candidates.localFile]];
    for (const [source, raw] of ordered) {
        if (raw === undefined)
            continue;
        try {
            return { pack: validateTablePack(raw), source, warnings };
        }
        catch (error) {
            warnings.push(`Ignoring ${describePackSource(source)} pack: ${errorMessage(error)}`);
        }
    }
    return { pack: FALLBACK_PACK, source: 'fallback', warnings };
}
