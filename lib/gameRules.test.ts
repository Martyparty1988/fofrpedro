import { describe, expect, it } from 'vitest';
import { GameObjectType } from '../types';
import { advanceTimer, getObstacleRequirement, moveTowards, resolveObstacleCollision } from './gameRules';

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
        obstacleType: GameObjectType.Policajt,
        isFlipping: false,
        isSliding: false,
        isInvincible: false,
        damageCooldown: 0,
    };

    it('uses the action required by each obstacle', () => {
        expect(resolveObstacleCollision({ ...defaultCollision, isFlipping: true })).toBe('destroy');
        expect(resolveObstacleCollision({ ...defaultCollision, isSliding: true })).toBe('pass');
        expect(resolveObstacleCollision({ ...defaultCollision, obstacleType: GameObjectType.Barikada, isSliding: true })).toBe('hit');
        expect(resolveObstacleCollision({ ...defaultCollision, obstacleType: GameObjectType.Leseni, isFlipping: true })).toBe('hit');
        expect(resolveObstacleCollision({ ...defaultCollision, obstacleType: GameObjectType.Leseni, isSliding: true })).toBe('pass');
        expect(resolveObstacleCollision({ ...defaultCollision, obstacleType: GameObjectType.Auto, isFlipping: true })).toBe('hit');
    });

    it('lets invincibility destroy every obstacle', () => {
        expect(resolveObstacleCollision({ ...defaultCollision, obstacleType: GameObjectType.Auto, isInvincible: true })).toBe('destroy');
    });

    it('prevents repeated damage during the cooldown', () => {
        expect(resolveObstacleCollision({ ...defaultCollision, damageCooldown: 0.25 })).toBe('protected');
    });

    it('reports a normal hit when no defense is active', () => {
        expect(resolveObstacleCollision(defaultCollision)).toBe('hit');
    });
});

describe('lane movement', () => {
    it('moves continuously without overshooting the target', () => {
        expect(moveTowards(0, 4, 1.5)).toBe(1.5);
        expect(moveTowards(3.8, 4, 1.5)).toBe(4);
        expect(moveTowards(4, -4, 2)).toBe(2);
    });

    it('describes every obstacle requirement', () => {
        expect(getObstacleRequirement(GameObjectType.Barikada)).toBe('jump');
        expect(getObstacleRequirement(GameObjectType.Leseni)).toBe('slide');
        expect(getObstacleRequirement(GameObjectType.Auto)).toBe('dodge');
    });
});
