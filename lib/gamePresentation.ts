export const MIN_GAME_MESSAGE_DURATION_MS = 3600;
export const MAX_GAME_MESSAGE_DURATION_MS = 5400;

export const getGameMessageDurationMs = (text: string): number => {
    const normalized = text.trim();
    const wordCount = normalized ? normalized.split(/\s+/).length : 0;
    const estimatedDuration = 2500 + wordCount * 180;

    return Math.min(
        MAX_GAME_MESSAGE_DURATION_MS,
        Math.max(MIN_GAME_MESSAGE_DURATION_MS, estimatedDuration),
    );
};
