export type ObstacleCollisionOutcome = 'destroy' | 'pass' | 'protected' | 'hit';

interface ObstacleCollisionInput {
    isFlipping: boolean;
    isSliding: boolean;
    isInvincible: boolean;
    damageCooldown: number;
}

export const advanceTimer = (value: number, deltaTime: number): number =>
    Math.max(0, value - Math.max(0, deltaTime));

export const resolveObstacleCollision = ({
    isFlipping,
    isSliding,
    isInvincible,
    damageCooldown,
}: ObstacleCollisionInput): ObstacleCollisionOutcome => {
    if (isFlipping || isInvincible) return 'destroy';
    if (isSliding) return 'pass';
    if (damageCooldown > 0) return 'protected';
    return 'hit';
};
