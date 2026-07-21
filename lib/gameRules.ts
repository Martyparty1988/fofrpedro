import { GameObjectType } from '../types';

export type ObstacleCollisionOutcome = 'destroy' | 'pass' | 'protected' | 'hit';
export type ObstacleRequirement = 'jump' | 'slide' | 'dodge' | 'either';

interface ObstacleCollisionInput {
    obstacleType: GameObjectType;
    isFlipping: boolean;
    isSliding: boolean;
    isInvincible: boolean;
    damageCooldown: number;
}

const REQUIREMENTS: Partial<Record<GameObjectType, ObstacleRequirement>> = {
    [GameObjectType.Policajt]: 'either',
    [GameObjectType.Auto]: 'dodge',
    [GameObjectType.Barikada]: 'jump',
    [GameObjectType.Leseni]: 'slide',
};

export const isObstacleType = (type: GameObjectType): boolean => type in REQUIREMENTS;

export const getObstacleRequirement = (type: GameObjectType): ObstacleRequirement | null =>
    REQUIREMENTS[type] ?? null;

export const moveTowards = (current: number, target: number, maxDelta: number): number => {
    if (maxDelta <= 0) return current;
    if (Math.abs(target - current) <= maxDelta) return target;
    return current + Math.sign(target - current) * maxDelta;
};

export const advanceTimer = (value: number, deltaTime: number): number =>
    Math.max(0, value - Math.max(0, deltaTime));

export const resolveObstacleCollision = ({
    obstacleType,
    isFlipping,
    isSliding,
    isInvincible,
    damageCooldown,
}: ObstacleCollisionInput): ObstacleCollisionOutcome => {
    if (isInvincible) return 'destroy';

    const requirement = getObstacleRequirement(obstacleType);
    if (requirement === 'jump' && isFlipping) return 'destroy';
    if (requirement === 'slide' && isSliding) return 'pass';
    if (requirement === 'either' && isFlipping) return 'destroy';
    if (requirement === 'either' && isSliding) return 'pass';
    if (damageCooldown > 0) return 'protected';
    return 'hit';
};
