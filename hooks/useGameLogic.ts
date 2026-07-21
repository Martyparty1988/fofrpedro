import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEffect, GameObject, GameObjectType, GameState, Lane, RunSummary, Settings } from '../types';
import { audioManager } from '../lib/audioManager';
import {
    COMBO_DURATION,
    COUNTDOWN_STEP_MS,
    DAMAGE_INVULNERABILITY,
    EFFECT_LIFESPAN,
    FIXED_TIMESTEP,
    FLIP_COOLDOWN,
    FLIP_DURATION,
    FLIP_SCORE_MULTIPLIER,
    GAME_OVER_DELAY_MS,
    INITIAL_GAME_SPEED,
    INITIAL_HEALTH,
    LANE_CHANGE_SPEED,
    LANE_WIDTH,
    MAX_CATCH_UP_STEPS,
    MAX_COMBO_MULTIPLIER,
    MAX_FRAME_DELTA,
    MAX_GAME_SPEED,
    MAX_HEALTH,
    NEAR_MISS_DISTANCE,
    OBJECT_DEFINITIONS,
    PLAYER_BOUNDS,
    PLAYER_SLIDE_BOUNDS,
    POWERUP_DURATION,
    SLIDE_COOLDOWN,
    SLIDE_DURATION,
    SPAWN_INTERVAL,
    SPEED_INCREASE_RATE,
    Z_SPAWN_POSITION,
} from '../constants/gameConstants';
import { hlasky, HlaskaCategory } from '../constants/hlasky';
import { advanceTimer, isObstacleType, moveTowards, resolveObstacleCollision } from '../lib/gameRules';
import { getGameMessageDurationMs } from '../lib/gamePresentation';
import { calculateRunCoins } from '../lib/progression';

type ObstaclePattern = (GameObjectType | null)[];

interface PatternDefinition {
    pattern: ObstaclePattern;
    minScore: number;
    weight: number;
}

const PATTERNS: PatternDefinition[] = [
    { pattern: [GameObjectType.Policajt, null, null], minScore: 0, weight: 18 },
    { pattern: [GameObjectType.Auto, null, null], minScore: 1800, weight: 10 },
    { pattern: [GameObjectType.Policajt, GameObjectType.Policajt, null], minScore: 4200, weight: 8 },
    { pattern: [GameObjectType.Barikada, null, null], minScore: 6500, weight: 8 },
    { pattern: [GameObjectType.Leseni, GameObjectType.Leseni, GameObjectType.Leseni], minScore: 9000, weight: 5 },
    { pattern: [GameObjectType.Auto, null, GameObjectType.Policajt], minScore: 11000, weight: 5 },
    { pattern: [GameObjectType.Barikada, GameObjectType.Barikada, null], minScore: 14500, weight: 4 },
    { pattern: [GameObjectType.Leseni, GameObjectType.Leseni, null], minScore: 17000, weight: 4 },
    { pattern: [GameObjectType.Policajt, GameObjectType.Auto, GameObjectType.Policajt], minScore: 22000, weight: 2 },
    { pattern: [GameObjectType.Barikada, GameObjectType.Barikada, GameObjectType.Barikada], minScore: 25000, weight: 3 },
];

const INTERRUPTING_MESSAGES = new Set<HlaskaCategory>(['collision', 'powerup', 'gameover']);

export const createInitialState = (): GameState => ({
    status: 'countdown',
    countdown: 3,
    score: 0,
    gameSpeed: INITIAL_GAME_SPEED,
    player: {
        lane: Lane.Middle,
        positionX: 0,
        health: INITIAL_HEALTH,
        damageCooldown: 0,
        isFlipping: false,
        flipProgress: 0,
        flipCooldown: 0,
        isSliding: false,
        slideProgress: 0,
        slideCooldown: 0,
    },
    gameObjects: [],
    activePowerUps: [],
    effects: [],
    combo: { count: 0, multiplier: 1, timeLeft: 0, best: 0 },
    stats: { distance: 0, collectibles: 0, destroyed: 0, avoided: 0, nearMisses: 0 },
});

const registerCombo = (state: GameState): GameState => {
    const count = state.combo.count + 1;
    const multiplier = Math.min(MAX_COMBO_MULTIPLIER, 1 + Math.floor(count / 4));
    return {
        ...state,
        combo: {
            count,
            multiplier,
            timeLeft: COMBO_DURATION,
            best: Math.max(state.combo.best, count),
        },
    };
};

const resetCombo = (state: GameState): GameState => ({
    ...state,
    combo: { ...state.combo, count: 0, multiplier: 1, timeLeft: 0 },
});

export const useGameLogic = (onGameOver: (summary: RunSummary) => void, settings: Settings) => {
    const [gameState, setGameState] = useState<GameState>(() => createInitialState());
    const gameStateRef = useRef(gameState);
    const gameLoopRef = useRef<number | null>(null);
    const gameOverTimeoutRef = useRef<number | null>(null);
    const lastTimeRef = useRef(0);
    const accumulatorRef = useRef(0);
    const distanceSinceLastSpawn = useRef(0);
    const lastUsedHlasky = useRef<string[]>([]);
    const scoreMilestone = useRef(10000);

    const commitGameState = useCallback((nextState: GameState) => {
        gameStateRef.current = nextState;
        setGameState(nextState);
    }, []);

    const addSpeechMessage = useCallback((state: GameState, category: HlaskaCategory): GameState => {
        const hasActiveMessage = state.effects.some(effect => effect.type === 'speech-bubble');
        const canInterrupt = INTERRUPTING_MESSAGES.has(category);
        if (hasActiveMessage && !canInterrupt) return state;
        const lines = hlasky[category];
        if (!lines?.length) return state;

        const availableLines = lines.filter(line => !lastUsedHlasky.current.includes(line));
        const linesToUse = availableLines.length > 0 ? availableLines : lines;
        const text = linesToUse[Math.floor(Math.random() * linesToUse.length)];
        lastUsedHlasky.current.push(text);
        if (lastUsedHlasky.current.length > 5) lastUsedHlasky.current.shift();

        const newEffect: GameEffect = {
            id: Date.now() + Math.random(),
            type: 'speech-bubble',
            position: [0, 0, 0],
            createdAt: Date.now(),
            text,
        };
        const effects = canInterrupt ? state.effects.filter(effect => effect.type !== 'speech-bubble') : state.effects;
        return { ...state, effects: [...effects, newEffect] };
    }, []);

    useEffect(() => {
        commitGameState(addSpeechMessage(gameStateRef.current, 'start'));
    }, [addSpeechMessage, commitGameState]);

    useEffect(() => {
        if (gameState.status !== 'countdown') return;
        const delay = gameState.countdown > 0 ? COUNTDOWN_STEP_MS : 320;
        const timeout = window.setTimeout(() => {
            const current = gameStateRef.current;
            if (current.status !== 'countdown') return;
            if (current.countdown > 0) {
                audioManager.playCountdownSound(false);
                commitGameState({ ...current, countdown: current.countdown - 1 });
            } else {
                audioManager.playCountdownSound(true);
                lastTimeRef.current = performance.now();
                accumulatorRef.current = 0;
                commitGameState({ ...current, status: 'playing' });
            }
        }, delay);
        return () => window.clearTimeout(timeout);
    }, [commitGameState, gameState.countdown, gameState.status]);

    const resetGame = useCallback(() => {
        if (gameOverTimeoutRef.current !== null) window.clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
        distanceSinceLastSpawn.current = 0;
        lastUsedHlasky.current = [];
        scoreMilestone.current = 10000;
        lastTimeRef.current = 0;
        accumulatorRef.current = 0;
        commitGameState(addSpeechMessage(createInitialState(), 'start'));
    }, [addSpeechMessage, commitGameState]);

    const pauseGame = useCallback(() => {
        const current = gameStateRef.current;
        if (current.status === 'playing') commitGameState({ ...current, status: 'paused' });
    }, [commitGameState]);

    const resumeGame = useCallback(() => {
        const current = gameStateRef.current;
        if (current.status !== 'paused') return;
        lastTimeRef.current = performance.now();
        accumulatorRef.current = 0;
        commitGameState({ ...current, status: 'playing' });
    }, [commitGameState]);

    const movePlayer = useCallback((direction: 'left' | 'right') => {
        const current = gameStateRef.current;
        if (current.status !== 'playing') return;
        let lane = current.player.lane;
        if (direction === 'left' && lane > Lane.Left) lane--;
        if (direction === 'right' && lane < Lane.Right) lane++;
        if (lane !== current.player.lane) commitGameState({ ...current, player: { ...current.player, lane } });
    }, [commitGameState]);

    const triggerFlip = useCallback(() => {
        const current = gameStateRef.current;
        const player = current.player;
        if (current.status !== 'playing' || player.isFlipping || player.isSliding || player.flipCooldown > 0) return;
        audioManager.playFlipSound();
        const nextState: GameState = {
            ...current,
            player: { ...player, isFlipping: true, flipProgress: 0, flipCooldown: FLIP_COOLDOWN + FLIP_DURATION },
        };
        commitGameState(addSpeechMessage(nextState, settings.reducedMotion ? 'jump' : 'frontflip'));
    }, [addSpeechMessage, commitGameState, settings.reducedMotion]);

    const triggerSlide = useCallback(() => {
        const current = gameStateRef.current;
        const player = current.player;
        if (current.status !== 'playing' || player.isSliding || player.isFlipping || player.slideCooldown > 0) return;
        audioManager.playSlideSound();
        const nextState: GameState = {
            ...current,
            player: { ...player, isSliding: true, slideProgress: 0, slideCooldown: SLIDE_COOLDOWN + SLIDE_DURATION },
        };
        commitGameState(addSpeechMessage(nextState, 'slide'));
    }, [addSpeechMessage, commitGameState]);

    const spawnGameObjects = useCallback((state: GameState): GameState => {
        if (distanceSinceLastSpawn.current < SPAWN_INTERVAL) return state;
        distanceSinceLastSpawn.current %= SPAWN_INTERVAL;
        const lanes: Lane[] = [Lane.Left, Lane.Middle, Lane.Right];
        const eligible = PATTERNS.filter(pattern => state.score >= pattern.minScore);
        const totalWeight = eligible.reduce((sum, pattern) => sum + pattern.weight, 0);
        let roll = Math.random() * totalWeight;
        const selected = eligible.find(pattern => ((roll -= pattern.weight) <= 0)) ?? eligible[eligible.length - 1];
        const pattern = [...selected.pattern].sort(() => Math.random() - 0.5);
        const objects: GameObject[] = [];
        const openLanes = [...lanes];

        pattern.forEach((type, index) => {
            if (type === null) return;
            const lane = lanes[index];
            const definition = OBJECT_DEFINITIONS[type];
            objects.push({
                id: Date.now() + Math.random(),
                type,
                lane,
                position: [lane * LANE_WIDTH, definition.height / 2, Z_SPAWN_POSITION],
                ...definition,
                hasPassedPlayer: false,
            });
            const openIndex = openLanes.indexOf(lane);
            if (openIndex >= 0) openLanes.splice(openIndex, 1);
        });

        const shuffledOpenLanes = [...openLanes].sort(() => Math.random() - 0.5);
        const collectibleCount = Math.floor(Math.random() * (shuffledOpenLanes.length + 1));
        for (let index = 0; index < collectibleCount; index++) {
            const lane = shuffledOpenLanes[index];
            const roll = Math.random();
            const type = roll < 0.7
                ? GameObjectType.Lajna
                : roll < 0.85
                    ? GameObjectType.Cevko
                    : roll < 0.95
                        ? GameObjectType.SpeedBoost
                        : GameObjectType.Invincibility;
            const definition = OBJECT_DEFINITIONS[type];
            objects.push({
                id: Date.now() + Math.random(),
                type,
                lane,
                position: [lane * LANE_WIDTH, 1, Z_SPAWN_POSITION],
                ...definition,
                hasPassedPlayer: false,
            });
        }
        return { ...state, gameObjects: [...state.gameObjects, ...objects] };
    }, []);

    const checkCollisions = useCallback((state: GameState): GameState => {
        let nextState: GameState = {
            ...state,
            player: { ...state.player },
            activePowerUps: [...state.activePowerUps],
            effects: [...state.effects],
            combo: { ...state.combo },
            stats: { ...state.stats },
        };
        const bounds = nextState.player.isSliding ? PLAYER_SLIDE_BOUNDS : PLAYER_BOUNDS;
        const playerPosition = { x: nextState.player.positionX, y: bounds.height / 2, z: 0 };
        const invincible = nextState.activePowerUps.some(powerUp => powerUp.type === GameObjectType.Invincibility);
        const objectsToKeep: GameObject[] = [];
        const newEffects: GameEffect[] = [];
        const createdAt = Date.now();

        for (const object of nextState.gameObjects) {
            const collisionX = Math.abs(playerPosition.x - object.position[0]) * 2 < bounds.width + object.width;
            const collisionY = Math.abs(playerPosition.y - object.position[1]) * 2 < bounds.height + object.height;
            const collisionZ = Math.abs(object.position[2]) * 2 < bounds.depth + object.depth;
            if (!collisionX || !collisionY || !collisionZ) {
                objectsToKeep.push(object);
                continue;
            }

            if (!isObstacleType(object.type)) {
                if (object.type === GameObjectType.Lajna) {
                    audioManager.playCollectSound();
                    const flipBonus = nextState.player.isFlipping ? FLIP_SCORE_MULTIPLIER : 1;
                    nextState.score += (OBJECT_DEFINITIONS[object.type].score ?? 0) * flipBonus * nextState.combo.multiplier;
                    newEffects.push({ id: object.id, type: 'lajna-collect', position: object.position, createdAt });
                } else if (object.type === GameObjectType.Cevko) {
                    audioManager.playCollectSound();
                    nextState.player.health = Math.min(MAX_HEALTH, nextState.player.health + 1);
                    newEffects.push({ id: object.id, type: 'cevko-collect', position: object.position, createdAt });
                } else {
                    audioManager.playPowerUpSound();
                    nextState = addSpeechMessage(nextState, 'powerup');
                    nextState.activePowerUps = nextState.activePowerUps.filter(powerUp => powerUp.type !== object.type);
                    nextState.activePowerUps.push({ type: object.type as GameObjectType.SpeedBoost | GameObjectType.Invincibility, timeLeft: POWERUP_DURATION });
                    newEffects.push({ id: object.id, type: 'powerup-collect', position: object.position, createdAt });
                }
                nextState.stats.collectibles++;
                nextState = registerCombo(nextState);
                continue;
            }

            const outcome = resolveObstacleCollision({
                obstacleType: object.type,
                isFlipping: nextState.player.isFlipping,
                isSliding: nextState.player.isSliding,
                isInvincible: invincible,
                damageCooldown: nextState.player.damageCooldown,
            });
            if (outcome === 'pass' || outcome === 'protected') {
                objectsToKeep.push(object);
            } else if (outcome === 'destroy') {
                audioManager.playDestroySound();
                nextState.score += 500 * nextState.combo.multiplier;
                nextState.stats.destroyed++;
                nextState = registerCombo(nextState);
                newEffects.push({ id: object.id, type: 'obstacle-destroy', position: object.position, createdAt });
            } else {
                audioManager.playDamageSound();
                nextState = resetCombo(addSpeechMessage(nextState, 'collision'));
                nextState.player.health = Math.max(0, nextState.player.health - 1);
                nextState.player.damageCooldown = DAMAGE_INVULNERABILITY;
                newEffects.push({ id: object.id, type: 'damage', position: [playerPosition.x, playerPosition.y, 0], createdAt });
                if (settings.haptics && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([80, 35, 120]);
            }
        }
        nextState.gameObjects = objectsToKeep;
        nextState.effects = [...nextState.effects, ...newEffects];
        return nextState;
    }, [addSpeechMessage, settings.haptics]);

    const registerPassedObstacles = useCallback((state: GameState): GameState => {
        let nextState = state;
        const objects = state.gameObjects.map(object => {
            if (!object.hasPassedPlayer && object.position[2] > 1.25 && isObstacleType(object.type)) {
                const nearMiss = Math.abs(state.player.positionX - object.position[0]) < NEAR_MISS_DISTANCE;
                nextState = {
                    ...nextState,
                    score: nextState.score + 75 * nextState.combo.multiplier + (nearMiss ? 150 : 0),
                    stats: {
                        ...nextState.stats,
                        avoided: nextState.stats.avoided + 1,
                        nearMisses: nextState.stats.nearMisses + (nearMiss ? 1 : 0),
                    },
                };
                nextState = registerCombo(nextState);
                if (nearMiss) audioManager.playNearMissSound();
                return { ...object, hasPassedPlayer: true };
            }
            return object;
        });
        return { ...nextState, gameObjects: objects };
    }, []);

    const scheduleGameOver = useCallback((state: GameState) => {
        if (gameOverTimeoutRef.current !== null) return;
        const baseSummary = {
            ...state.stats,
            score: Math.floor(state.score),
            bestCombo: state.combo.best,
        };
        const summary: RunSummary = { ...baseSummary, coinsEarned: calculateRunCoins(baseSummary) };
        audioManager.duckMusic();
        audioManager.playGameOverSound();
        gameOverTimeoutRef.current = window.setTimeout(() => onGameOver(summary), GAME_OVER_DELAY_MS);
    }, [onGameOver]);

    const gameLoop = useCallback((time: number) => {
        const currentState = gameStateRef.current;
        if (currentState.status !== 'playing') return;
        if (lastTimeRef.current === 0) {
            lastTimeRef.current = time;
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const elapsed = Math.min((time - lastTimeRef.current) / 1000, MAX_FRAME_DELTA);
        lastTimeRef.current = time;
        accumulatorRef.current = Math.min(accumulatorRef.current + elapsed, MAX_FRAME_DELTA);
        const availableSteps = Math.floor(accumulatorRef.current / FIXED_TIMESTEP);
        if (availableSteps === 0) {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const stepsToRun = Math.min(availableSteps, MAX_CATCH_UP_STEPS);
        accumulatorRef.current -= stepsToRun * FIXED_TIMESTEP;
        let nextState = currentState;

        for (let step = 0; step < stepsToRun; step++) {
            const now = Date.now();
            nextState = {
                ...nextState,
                player: { ...nextState.player },
                gameObjects: [...nextState.gameObjects],
                activePowerUps: [...nextState.activePowerUps],
                effects: [...nextState.effects],
                combo: { ...nextState.combo },
                stats: { ...nextState.stats },
            };
            nextState.player.positionX = moveTowards(
                nextState.player.positionX,
                nextState.player.lane * LANE_WIDTH,
                LANE_CHANGE_SPEED * FIXED_TIMESTEP,
            );
            nextState.player.flipCooldown = advanceTimer(nextState.player.flipCooldown, FIXED_TIMESTEP);
            nextState.player.slideCooldown = advanceTimer(nextState.player.slideCooldown, FIXED_TIMESTEP);
            nextState.player.damageCooldown = advanceTimer(nextState.player.damageCooldown, FIXED_TIMESTEP);
            nextState.combo.timeLeft = advanceTimer(nextState.combo.timeLeft, FIXED_TIMESTEP);
            if (nextState.combo.count > 0 && nextState.combo.timeLeft <= 0) nextState = resetCombo(nextState);
            nextState.activePowerUps = nextState.activePowerUps
                .map(powerUp => ({ ...powerUp, timeLeft: advanceTimer(powerUp.timeLeft, FIXED_TIMESTEP) }))
                .filter(powerUp => powerUp.timeLeft > 0);
            nextState.effects = nextState.effects.filter(effect => {
                const lifespan = effect.type === 'speech-bubble' ? getGameMessageDurationMs(effect.text ?? '') : EFFECT_LIFESPAN;
                return now - effect.createdAt < lifespan;
            });

            if (nextState.player.isFlipping) {
                nextState.player.flipProgress = Math.min(1, nextState.player.flipProgress + FIXED_TIMESTEP / FLIP_DURATION);
                if (nextState.player.flipProgress >= 1) {
                    nextState.player.isFlipping = false;
                    nextState.player.flipProgress = 0;
                }
            }
            if (nextState.player.isSliding) {
                nextState.player.slideProgress = Math.min(1, nextState.player.slideProgress + FIXED_TIMESTEP / SLIDE_DURATION);
                if (nextState.player.slideProgress >= 1) {
                    nextState.player.isSliding = false;
                    nextState.player.slideProgress = 0;
                }
            }

            const speedBoosted = nextState.activePowerUps.some(powerUp => powerUp.type === GameObjectType.SpeedBoost);
            const currentSpeed = nextState.gameSpeed * (speedBoosted ? 1.5 : 1);
            nextState.gameSpeed = Math.min(MAX_GAME_SPEED, nextState.gameSpeed + SPEED_INCREASE_RATE * FIXED_TIMESTEP);
            nextState.score += FIXED_TIMESTEP * currentSpeed * nextState.combo.multiplier
                * (nextState.player.isFlipping ? FLIP_SCORE_MULTIPLIER : 1);
            if (nextState.score >= scoreMilestone.current) {
                nextState = addSpeechMessage(nextState, 'pedroultimate');
                scoreMilestone.current += 10000;
            }

            const distanceMoved = currentSpeed * FIXED_TIMESTEP;
            nextState.stats.distance += distanceMoved;
            distanceSinceLastSpawn.current += distanceMoved;
            nextState.gameObjects = nextState.gameObjects
                .map(object => ({ ...object, position: [object.position[0], object.position[1], object.position[2] + distanceMoved] as [number, number, number] }))
                .filter(object => object.position[2] < 20);
            nextState = spawnGameObjects(nextState);
            nextState = checkCollisions(nextState);
            nextState = registerPassedObstacles(nextState);
            if (nextState.player.health <= 0) break;
        }

        if (nextState.player.health <= 0) {
            nextState = addSpeechMessage({ ...nextState, status: 'gameOver' }, 'gameover');
            commitGameState(nextState);
            scheduleGameOver(nextState);
            return;
        }
        commitGameState(nextState);
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [addSpeechMessage, checkCollisions, commitGameState, registerPassedObstacles, scheduleGameOver, spawnGameObjects]);

    useEffect(() => {
        if (gameState.status === 'playing') {
            lastTimeRef.current = performance.now();
            accumulatorRef.current = 0;
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        } else if (gameLoopRef.current !== null) {
            cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        }
        return () => {
            if (gameLoopRef.current !== null) cancelAnimationFrame(gameLoopRef.current);
            gameLoopRef.current = null;
        };
    }, [gameLoop, gameState.status]);

    useEffect(() => {
        audioManager.setMusicVolume(settings.musicVolume);
        audioManager.setSfxVolume(settings.sfxVolume);
    }, [settings.musicVolume, settings.sfxVolume]);

    useEffect(() => () => {
        if (gameOverTimeoutRef.current !== null) window.clearTimeout(gameOverTimeoutRef.current);
    }, []);

    return { gameState, movePlayer, triggerFlip, triggerSlide, pauseGame, resumeGame, resetGame };
};
