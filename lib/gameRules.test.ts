import { describe, expect, it } from 'vitest';
import { advanceTimer, resolveObstacleCollision } from './gameRules';

describe('advanceTimer', () => {
    it('uses elapsed time instead of frame count', () => {
        const runForOneSecond = (frames: number) => Array.from({ length: frames }, () => 0)
            .reduce<number>(timer => advanceTimer(timer, 1 / frames), 5);

        expect(runForOneSecond(30)).toBeCloseTo(4, 10);
        expect(runForOneSecond(60)).toBeCloseTo(4, 10);
        expect(runForOneSecond(120)).toBeCloseTo(4, 10);
    });

    it('never returns a negative timer', () => {
        expect(advanceTimer(0.1, 1)).toBe(0);
        expect(advanceTimer(1, -1)).toBe(1);
    });
});

describe('resolveObstacleCollision', () => {
    const defaultCollision = {
        isFlipping: false,
        isSliding: false,
        isInvincible: false,
        damageCooldown: 0,
    };

    it('destroys an obstacle while flipping or invincible', () => {
        expect(resolveObstacleCollision({ ...defaultCollision, isFlipping: true })).toBe('destroy');
        expect(resolveObstacleCollision({ ...defaultCollision, isInvincible: true })).toBe('destroy');
    });

    it('passes an obstacle while sliding', () => {
        expect(resolveObstacleCollision({ ...defaultCollision, isSliding: true })).toBe('pass');
    });

    it('prevents repeated damage during the cooldown', () => {
        expect(resolveObstacleCollision({ ...defaultCollision, damageCooldown: 0.25 })).toBe('protected');
    });

    it('reports a normal hit when no defense is active', () => {
        expect(resolveObstacleCollision(defaultCollision)).toBe('hit');
    });
});
