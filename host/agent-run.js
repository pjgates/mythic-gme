import { isAgentRefusal, parseAgentRequest, refusal } from "../engine/agent.js";
import { errorMessage } from "../engine/errors.js";
/**
 * The binding is captured when the call arrives. If the chat changes before the save completes, the controller keeps
 * the result with its original chat and rejects; that rejection (like every other) becomes a structured refusal, so
 * an agent never receives prose and never acts on another chat's roll.
 */
export function createAgentRun(controller) {
    return async (kind, args) => {
        try {
            const body = parseAgentRequest(kind, args);
            const { binding, document, status } = controller.state;
            if (!document)
                return refusal(status);
            const receipt = await controller.submit({ operationId: crypto.randomUUID(), binding, expectedRevision: document.revision,
                caller: 'agent', body });
            return receipt.agent;
        }
        catch (error) {
            return toRefusal(error);
        }
    };
}
export function toRefusal(error) {
    if (isAgentRefusal(error))
        return error;
    return refusal(errorMessage(error));
}
