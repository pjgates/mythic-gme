/**
 * Slash commands answer in chat with the summary and also open the drawer, so the matching receipt card is on
 * screen without a second tap. A refused command opens nothing: the refusal is already the whole answer.
 */
export function revealingSubmit(submit, drawer) {
    return async (body) => {
        const receipt = await submit(body);
        drawer.show();
        return receipt;
    };
}
