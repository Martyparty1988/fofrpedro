import { describe, expect, it } from 'vitest';
import { calculateRunCoins, getDailyChallenge, getLocalDateKey, isDailyChallengeComplete } from './progression';

const summary = {
    score: 15000,
    distance: 500,
    collectibles: 20,
    destroyed: 4,
    avoided: 30,
    nearMisses: 2,
    bestCombo: 12,
    coinsEarned: 0,
};

describe('daily progression', () => {
    const { coinsEarned: _coinsEarned, ...coinInput } = summary;
    it('creates a deterministic challenge for a local calendar day', () => {
        const date = new Date(2026, 6, 21, 12);
        expect(getLocalDateKey(date)).toBe('2026-07-21');
        expect(getDailyChallenge(date)).toEqual(getDailyChallenge(date));
        expect(getDailyChallenge(date).id).toBe('2026-07-21');
    });

    it('evaluates the selected metric', () => {
        const challenge = { ...getDailyChallenge(new Date(2026, 6, 21)), metric: 'score' as const, target: 10000 };
        expect(isDailyChallengeComplete(challenge, summary)).toBe(true);
        expect(isDailyChallengeComplete({ ...challenge, target: 20000 }, summary)).toBe(false);
    });

    it('rewards performance without ever returning zero coins', () => {
        expect(calculateRunCoins(coinInput)).toBeGreaterThan(1);
        expect(calculateRunCoins({ ...coinInput, score: 0, collectibles: 0, nearMisses: 0, bestCombo: 0 })).toBe(1);
    });
});
