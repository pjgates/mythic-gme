export const CAPABILITY_NAMES = [
    'chatIdentity', 'perChatStorage', 'globalStorage', 'slashCommands', 'functionTools', 'promptInjection', 'filePicker', 'composer',
];
export function unavailable(reason) {
    return { available: false, reason };
}
