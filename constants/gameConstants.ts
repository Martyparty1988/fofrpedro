import { GameObjectType } from '../types';

export const INITIAL_GAME_SPEED = 15;
export const MAX_GAME_SPEED = 50;
export const SPEED_INCREASE_RATE = 0.005;

export const INITIAL_HEALTH = 3;
export const MAX_HEALTH = 5;

export const FLIP_DURATION = 30; // frames
export const FLIP_COOLDOWN = 54; // frames (~0.9s at 60fps)
export const FLIP_SCORE_MULTIPLIER = 3;

export const SLIDE_DURATION = 30; // frames (0.5s at 60fps)
export const SLIDE_COOLDOWN = 30; // frames

export const PLAYER_BOUNDS = { width: 0.8, height: 1.8, depth: 0.5 };
export const PLAYER_SLIDE_BOUNDS = { width: 0.8, height: 0.8, depth: 1.5 };

export const OBJECT_DEFINITIONS: Record<GameObjectType, { width: number, height: number, depth: number, score?: number }> = {
    [GameObjectType.Lajna]: { width: 0.5, height: 0.1, depth: 0.5, score: 100 },
    [GameObjectType.Cevko]: { width: 0.8, height: 0.8, depth: 0.8 },
    [GameObjectType.SpeedBoost]: { width: 1, height: 1, depth: 1 },
    [GameObjectType.Invincibility]: { width: 0.7, height: 0.7, depth: 0.7 },
    [GameObjectType.Policajt]: { width: 1.2, height: 2.2, depth: 0.8 },
    [GameObjectType.Auto]: { width: 2.5, height: 1.2, depth: 5 },
    [GameObjectType.Barikada]: { width: 2.8, height: 1.2, depth: 0.8 },
};

export const POWERUP_DURATION = 300; // 5 seconds at 60fps
export const EFFECT_LIFESPAN = 1000; // 1 second in ms

export const Z_SPAWN_POSITION = -150;
export const SPAWN_INTERVAL = 25;

export const LANE_WIDTH = 4;
