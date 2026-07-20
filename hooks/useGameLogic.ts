import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameObject, Lane, GameObjectType, GameEffect, Settings } from '../types';
import { audioManager } from '../lib/audioManager';
import {
    INITIAL_GAME_SPEED,
    MAX_GAME_SPEED,
    SPEED_INCREASE_RATE,
    INITIAL_HEALTH,
    MAX_HEALTH,
    FLIP_DURATION,
    FLIP_COOLDOWN,
    FLIP_SCORE_MULTIPLIER,
    SLIDE_DURATION,
    SLIDE_COOLDOWN,
    DAMAGE_INVULNERABILITY,
    PLAYER_BOUNDS,
    PLAYER_SLIDE_BOUNDS,
    OBJECT_DEFINITIONS,
    POWERUP_DURATION,
    EFFECT_LIFESPAN,
    Z_SPAWN_POSITION,
    SPAWN_INTERVAL,
    LANE_WIDTH,
    FIXED_TIMESTEP,
    MAX_FRAME_DELTA,
    MAX_CATCH_UP_STEPS,
} from '../constants/gameConstants';
import { hlasky, HlaskaCategory } from '../constants/hlasky';
import { advanceTimer, resolveObstacleCollision } from '../lib/gameRules';
import { getGameMessageDurationMs } from '../lib/gamePresentation';

type ObstaclePattern = (GameObjectType | null)[];

interface PatternDefinition {
    pattern: ObstaclePattern;
    minScore: number;
    weight: number;
}

const PATTERNS: PatternDefinition[] = [
    { pattern: [GameObjectType.Policajt, null, null], minScore: 0, weight: 10 },
    { pattern: [null, GameObjectType.Policajt, null], minScore: 0, weight: 10 },
    { pattern: [null, null, GameObjectType.Policajt], minScore: 0, weight: 10 },
    { pattern: [GameObjectType.Auto, null, null], minScore: 2000, weight: 8 },
    { pattern: [null, GameObjectType.Auto, null], minScore: 2000, weight: 8 },
    { pattern: [null, null, GameObjectType.Auto], minScore: 2000, weight: 8 },
    { pattern: [GameObjectType.Policajt, GameObjectType.Policajt, null], minScore: 5000, weight: 5 },
    { pattern: [null, GameObjectType.Policajt, GameObjectType.Policajt], minScore: 5000, weight: 5 },
    { pattern: [GameObjectType.Policajt, null, GameObjectType.Policajt], minScore: 7000, weight: 4 },
    { pattern: [GameObjectType.Auto, null, GameObjectType.Policajt], minScore: 10000, weight: 3 },
    { pattern: [GameObjectType.Policajt, null, GameObjectType.Auto], minScore: 10000, weight: 3 },
    { pattern: [GameObjectType.Barikada, null, null], minScore: 15000, weight: 5 },
    { pattern: [GameObjectType.Auto, GameObjectType.Auto, null], minScore: 20000, weight: 2 },
    { pattern: [GameObjectType.Policajt, GameObjectType.Auto, GameObjectType.Policajt], minScore: 22000, weight: 1 },
    { pattern: [GameObjectType.Barikada, GameObjectType.Barikada, GameObjectType.Barikada], minScore: 25000, weight: 2 },
];

const INTERRUPTING_MESSAGES = new Set<HlaskaCategory>(['collision', 'powerup', 'gameover']);

export const createInitialState = (): GameState => ({
    status: 'playing',
    score: 0,
    gameSpeed: INITIAL_GAME_SPEED,
    player: {
        lane: Lane.Middle,
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
});

export const useGameLogic = (onGameOver: (score: number) => void, settings: Settings) => {
    const [gameState, setGameState] = useState<GameState>(() => createInitialState());
    const gameStateRef = useRef(gameState);
    const gameLoopRef = useRef<number | null>(null);
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

        const createdAt = Date.now();
        const newEffect: GameEffect = {
            id: createdAt + Math.random(),
            type: 'speech-bubble',
            position: [0, 0, 0],
            createdAt,
            text,
        };

        const effects = canInterrupt
            ? state.effects.filter(effect => effect.type !== 'speech-bubble')
            : state.effects;
        return { ...state, effects: [...effects, newEffect] };
    }, []);

    useEffect(() => {
        commitGameState(addSpeechMessage(gameStateRef.current, 'start'));
    }, [addSpeechMessage, commitGameState]);

    const resetGame = useCallback(() => {
        distanceSinceLastSpawn.current = 0;
        lastUsedHlasky.current = [];
        scoreMilestone.current = 10000;
        lastTimeRef.current = performance.now();
        accumulatorRef.current = 0;
        commitGameState(addSpeechMessage(createInitialState(), 'start'));
    }, [addSpeechMessage, commitGameState]);

    const pauseGame = useCallback(() => {
        const current = gameStateRef.current;
        if (current.status === 'playing') {
            commitGameState({ ...current, status: 'paused' });
        }
    }, [commitGameState]);

    const resumeGame = useCallback(() => {
        const current = gameStateRef.current;
        if (current.status === 'paused') {
            lastTimeRef.current = performance.now();
            accumulatorRef.current = 0;
            commitGameState({ ...current, status: 'playing' });
        }
    }, [commitGameState]);

    const movePlayer = useCallback((direction: 'left' | 'right') => {
        const current = gameStateRef.current;
        if (current.status !== 'playing') return;

        let newLane = current.player.lane;
        if (direction === 'left' && newLane > Lane.Left) newLane--;
        if (direction === 'right' && newLane < Lane.Right) newLane++;
        if (newLane === current.player.lane) return;

        commitGameState({
            ...current,
            player: { ...current.player, lane: newLane },
        });
    }, [commitGameState]);

    const triggerFlip = useCallback(() => {
        const current = gameStateRef.current;
        const player = current.player;
        if (
            current.status !== 'playing' ||
            player.isFlipping ||
            player.isSliding ||
            player.flipCooldown > 0
        ) return;

        audioManager.playFlipSound();
        const nextState: GameState = {
            ...current,
            player: {
                ...player,
                isFlipping: true,
                flipProgress: 0,
                flipCooldown: FLIP_COOLDOWN + FLIP_DURATION,
            },
        };
        commitGameState(addSpeechMessage(nextState, settings.reducedMotion ? 'jump' : 'frontflip'));
    }, [addSpeechMessage, commitGameState, settings.reducedMotion]);

    const triggerSlide = useCallback(() => {
        const current = gameStateRef.current;
        const player = current.player;
        if (
            current.status !== 'playing' ||
            player.isSliding ||
            player.isFlipping ||
            player.slideCooldown > 0
        ) return;

        audioManager.playSlideSound();
        const nextState: GameState = {
            ...current,
            player: {
                ...player,
                isSliding: true,
                slideProgress: 0,
                slideCooldown: SLIDE_COOLDOWN + SLIDE_DURATION,
            },
        };
        commitGameState(addSpeechMessage(nextState, 'slide'));
    }, [addSpeechMessage, commitGameState]);

    const spawnGameObjects = useCallback((state: GameState): GameState => {
        if (distanceSinceLastSpawn.current < SPAWN_INTERVAL) return state;
        distanceSinceLastSpawn.current = 0;

        const newObjects: GameObject[] = [];
        const lanes: Lane[] = [Lane.Left, Lane.Middle, Lane.Right];
        const availableLanesForCollectibles = [...lanes];
        const eligiblePatterns = PATTERNS.filter(pattern => state.score >= pattern.minScore);
        const totalWeight = eligiblePatterns.reduce((sum, pattern) => sum + pattern.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        const chosenDefinition = eligiblePatterns.find(pattern => {
            randomWeight -= pattern.weight;
            return randomWeight <= 0;
        }) ?? eligiblePatterns[eligiblePatterns.length - 1];

        const chosenPattern = [...chosenDefinition.pattern];
        for (let index = chosenPattern.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [chosenPattern[index], chosenPattern[randomIndex]] = [chosenPattern[randomIndex], chosenPattern[index]];
        }

        const hasBarikada = chosenPattern.some(type => type === GameObjectType.Barikada);
        if (hasBarikada) availableLanesForCollectibles.length = 0;

        chosenPattern.forEach((type, index) => {
            if (type === null) return;

            const lane = lanes[index];
            const definition = OBJECT_DEFINITIONS[type];
            newObjects.push({
                id: Date.now() + Math.random(),
                type,
                lane,
                position: [lane * LANE_WIDTH, definition.height / 2, Z_SPAWN_POSITION],
                ...definition,
            });

            if (!hasBarikada) {
                const laneIndex = availableLanesForCollectibles.indexOf(lane);
                if (laneIndex >= 0) availableLanesForCollectibles.splice(laneIndex, 1);
            }
        });

        const shuffledLanes = [...availableLanesForCollectibles];
        for (let index = shuffledLanes.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [shuffledLanes[index], shuffledLanes[randomIndex]] = [shuffledLanes[randomIndex], shuffledLanes[index]];
        }
        const collectibleCount = Math.floor(Math.random() * (shuffledLanes.length + 1));

        for (let index = 0; index < collectibleCount; index++) {
            const lane = shuffledLanes[index];
            const randomValue = Math.random();
            const collectibleType = randomValue < 0.7
                ? GameObjectType.Lajna
                : randomValue < 0.85
                    ? GameObjectType.Cevko
                    : randomValue < 0.95
                        ? GameObjectType.SpeedBoost
                        : GameObjectType.Invincibility;
            const definition = OBJECT_DEFINITIONS[collectibleType];

            newObjects.push({
                id: Date.now() + Math.random(),
                type: collectibleType,
                lane,
                position: [lane * LANE_WIDTH, 1, Z_SPAWN_POSITION],
                ...definition,
            });
        }

        return { ...state, gameObjects: [...state.gameObjects, ...newObjects] };
    }, []);

    const checkCollisions = useCallback((state: GameState): GameState => {
        let newState: GameState = {
            ...state,
            player: { ...state.player },
            activePowerUps: [...state.activePowerUps],
            effects: [...state.effects],
        };
        const playerBounds = newState.player.isSliding ? PLAYER_SLIDE_BOUNDS : PLAYER_BOUNDS;
        const playerPosition = {
            x: newState.player.lane * LANE_WIDTH,
            y: playerBounds.height / 2,
            z: 0,
        };
        const isInvincible = newState.activePowerUps.some(powerUp => powerUp.type === GameObjectType.Invincibility);
        const objectsToKeep: GameObject[] = [];
        const newEffects: GameEffect[] = [];
        const createdAt = Date.now();

        for (const object of newState.gameObjects) {
            const collisionX = Math.abs(playerPosition.x - object.position[0]) * 2 < playerBounds.width + object.width;
            const collisionY = Math.abs(playerPosition.y - object.position[1]) * 2 < playerBounds.height + object.height;
            const collisionZ = Math.abs(playerPosition.z - object.position[2]) * 2 < playerBounds.depth + object.depth;

            if (!collisionX || !collisionY || !collisionZ) {
                objectsToKeep.push(object);
                continue;
            }

            switch (object.type) {
                case GameObjectType.Lajna:
                    audioManager.playCollectSound();
                    newState.score += (OBJECT_DEFINITIONS[object.type].score ?? 0)
                        * (newState.player.isFlipping ? FLIP_SCORE_MULTIPLIER : 1);
                    newEffects.push({ id: object.id, type: 'lajna-collect', position: object.position, createdAt });
                    break;
                case GameObjectType.Cevko:
                    audioManager.playCollectSound();
                    newState.player.health = Math.min(MAX_HEALTH, newState.player.health + 1);
                    newEffects.push({ id: object.id, type: 'cevko-collect', position: object.position, createdAt });
                    break;
                case GameObjectType.SpeedBoost:
                case GameObjectType.Invincibility:
                    audioManager.playPowerUpSound();
                    newState = addSpeechMessage(newState, 'powerup');
                    newState.activePowerUps = newState.activePowerUps.filter(powerUp => powerUp.type !== object.type);
                    newState.activePowerUps.push({ type: object.type, timeLeft: POWERUP_DURATION });
                    newEffects.push({ id: object.id, type: 'powerup-collect', position: object.position, createdAt });
                    break;
                default: {
                    const outcome = resolveObstacleCollision({
                        isFlipping: newState.player.isFlipping,
                        isSliding: newState.player.isSliding,
                        isInvincible,
                        damageCooldown: newState.player.damageCooldown,
                    });

                    if (outcome === 'pass') {
                        objectsToKeep.push(object);
                    } else if (outcome === 'destroy') {
                        audioManager.playDestroySound();
                        newState.score += 500;
                        newEffects.push({ id: object.id, type: 'obstacle-destroy', position: object.position, createdAt });
                    } else if (outcome === 'hit') {
                        audioManager.playDamageSound();
                        newState = addSpeechMessage(newState, 'collision');
                        newState.player.health = Math.max(0, newState.player.health - 1);
                        newState.player.damageCooldown = DAMAGE_INVULNERABILITY;
                        newEffects.push({
                            id: object.id,
                            type: 'damage',
                            position: [playerPosition.x, playerPosition.y, playerPosition.z],
                            createdAt,
                        });
                        if (settings.haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate(200);
                        }
                    }
                    break;
                }
            }
        }

        newState.gameObjects = objectsToKeep;
        newState.effects = [...newState.effects, ...newEffects];
        return newState;
    }, [addSpeechMessage, settings.haptics]);

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
            };

            nextState.player.flipCooldown = advanceTimer(nextState.player.flipCooldown, FIXED_TIMESTEP);
            nextState.player.slideCooldown = advanceTimer(nextState.player.slideCooldown, FIXED_TIMESTEP);
            nextState.player.damageCooldown = advanceTimer(nextState.player.damageCooldown, FIXED_TIMESTEP);
            nextState.activePowerUps = nextState.activePowerUps
                .map(powerUp => ({ ...powerUp, timeLeft: advanceTimer(powerUp.timeLeft, FIXED_TIMESTEP) }))
                .filter(powerUp => powerUp.timeLeft > 0);
            nextState.effects = nextState.effects.filter(effect => {
                const lifespan = effect.type === 'speech-bubble'
                    ? getGameMessageDurationMs(effect.text ?? '')
                    : EFFECT_LIFESPAN;
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

            const isSpeedBoosted = nextState.activePowerUps.some(powerUp => powerUp.type === GameObjectType.SpeedBoost);
            const currentSpeed = nextState.gameSpeed * (isSpeedBoosted ? 1.5 : 1);
            nextState.gameSpeed = Math.min(MAX_GAME_SPEED, nextState.gameSpeed + SPEED_INCREASE_RATE * FIXED_TIMESTEP);
            nextState.score += FIXED_TIMESTEP * currentSpeed
                * (nextState.player.isFlipping ? FLIP_SCORE_MULTIPLIER : 1);

            if (nextState.score >= scoreMilestone.current) {
                nextState = addSpeechMessage(nextState, 'pedroultimate');
                scoreMilestone.current += 10000;
            }

            const distanceMoved = currentSpeed * FIXED_TIMESTEP;
            distanceSinceLastSpawn.current += distanceMoved;
            nextState.gameObjects = nextState.gameObjects
                .map(object => ({
                    ...object,
                    position: [object.position[0], object.position[1], object.position[2] + distanceMoved] as [number, number, number],
                }))
                .filter(object => object.position[2] < 20);

            nextState = spawnGameObjects(nextState);
            nextState = checkCollisions(nextState);
            if (nextState.player.health <= 0) break;
        }

        if (nextState.player.health <= 0) {
            nextState = addSpeechMessage({ ...nextState, status: 'gameOver' }, 'gameover');
            commitGameState(nextState);
            audioManager.playGameOverSound();
            onGameOver(Math.floor(nextState.score));
            return;
        }

        commitGameState(nextState);
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [addSpeechMessage, checkCollisions, commitGameState, onGameOver, spawnGameObjects]);

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
            if (gameLoopRef.current !== null) {
                cancelAnimationFrame(gameLoopRef.current);
                gameLoopRef.current = null;
            }
        };
    }, [gameLoop, gameState.status]);

    useEffect(() => {
        audioManager.setVolume(settings.volume);
    }, [settings.volume]);

    return {
        gameState,
        movePlayer,
        triggerFlip,
        triggerSlide,
        pauseGame,
        resumeGame,
        resetGame,
    };
};
