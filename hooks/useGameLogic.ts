import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameObject, Lane, PlayerState, GameObjectType, PowerUpState } from '../types';
import { audioManager } from '../lib/audioManager';
import { Settings } from '../types';

const INITIAL_GAME_SPEED = 15;
const MAX_GAME_SPEED = 50;
const SPEED_INCREASE_RATE = 0.005;
const INITIAL_HEALTH = 3;
const MAX_HEALTH = 5;

const FLIP_DURATION = 30; // frames
const FLIP_COOLDOWN = 54; // frames (~0.9s at 60fps)
const FLIP_SCORE_MULTIPLIER = 3;

const SLIDE_DURATION = 30; // frames (0.5s at 60fps)
const SLIDE_COOLDOWN = 30; // frames

const PLAYER_BOUNDS = { width: 0.8, height: 1.8, depth: 0.5 };
const PLAYER_SLIDE_BOUNDS = { width: 0.8, height: 0.8, depth: 1.5 };

const OBJECT_DEFINITIONS: Record<GameObjectType, { width: number, height: number, depth: number, score?: number }> = {
    [GameObjectType.Lajna]: { width: 0.5, height: 0.1, depth: 0.5, score: 100 },
    [GameObjectType.Cevko]: { width: 0.8, height: 0.8, depth: 0.8 },
    [GameObjectType.SpeedBoost]: { width: 1, height: 1, depth: 1 },
    [GameObjectType.Invincibility]: { width: 0.7, height: 0.7, depth: 0.7 },
    [GameObjectType.Policajt]: { width: 1.2, height: 2.2, depth: 0.8 },
    [GameObjectType.Auto]: { width: 2.5, height: 1.2, depth: 5 },
    [GameObjectType.Barikada]: { width: 2.8, height: 1.2, depth: 0.8 },
};

const POWERUP_DURATION = 300; // 5 seconds at 60fps

// FIX: Moved createInitialState outside the hook to provide a stable function reference for lazy initialization.
function createInitialState(): GameState {
    return {
        status: 'playing',
        score: 0,
        gameSpeed: INITIAL_GAME_SPEED,
        player: {
            lane: Lane.Middle,
            health: INITIAL_HEALTH,
            isFlipping: false,
            flipProgress: 0,
            flipCooldown: 0,
            isSliding: false,
            slideProgress: 0,
            slideCooldown: 0,
        },
        gameObjects: [],
        activePowerUps: [],
    };
}

export const useGameLogic = (onGameOver: (score: number) => void, settings: Settings) => {
    // FIX: Changed to an arrow function for lazy initialization to resolve a potential tooling issue with the direct function reference.
    const [gameState, setGameState] = useState<GameState>(() => createInitialState());
    // FIX: Initialize useRef with null to prevent "Expected 1 arguments, but got 0" error in stricter environments.
    const gameLoopRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const distanceSinceLastSpawn = useRef(0);

    const laneWidth = 4;

    const resetGame = useCallback(() => {
        setGameState(createInitialState());
        distanceSinceLastSpawn.current = 0;
    }, []);

    const pauseGame = useCallback(() => {
        setGameState(prev => ({ ...prev, status: 'paused' }));
    }, []);
    
    const resumeGame = useCallback(() => {
        setGameState(prev => ({ ...prev, status: 'playing' }));
        lastTimeRef.current = performance.now();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, []);

    const movePlayer = useCallback((direction: 'left' | 'right') => {
        if (gameState.status !== 'playing') return;
        setGameState(prev => {
            let newLane = prev.player.lane;
            if (direction === 'left' && newLane > Lane.Left) {
                newLane--;
            } else if (direction === 'right' && newLane < Lane.Right) {
                newLane++;
            }
            return { ...prev, player: { ...prev.player, lane: newLane } };
        });
    }, [gameState.status]);

    const triggerFlip = useCallback(() => {
        if (gameState.status !== 'playing' || gameState.player.isFlipping || gameState.player.isSliding || gameState.player.flipCooldown > 0) return;
        
        audioManager.playFlipSound();
        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, isFlipping: true, flipProgress: 0, flipCooldown: FLIP_COOLDOWN + FLIP_DURATION }
        }));
    }, [gameState.status, gameState.player.flipCooldown, gameState.player.isFlipping, gameState.player.isSliding]);
    
    const triggerSlide = useCallback(() => {
        if (gameState.status !== 'playing' || gameState.player.isSliding || gameState.player.isFlipping || gameState.player.slideCooldown > 0) return;
        
        // audioManager.playSlideSound(); // TODO: Add sound
        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, isSliding: true, slideProgress: 0, slideCooldown: SLIDE_COOLDOWN + SLIDE_DURATION }
        }));
    }, [gameState.status, gameState.player.isSliding, gameState.player.isFlipping, gameState.player.slideCooldown]);


    const spawnGameObjects = (state: GameState): GameState => {
        const Z_SPAWN_POSITION = -150;
        const SPAWN_INTERVAL = 25;

        if (distanceSinceLastSpawn.current < SPAWN_INTERVAL) {
            return state;
        }
        distanceSinceLastSpawn.current = 0;

        const newObjects: GameObject[] = [];
        const lanes: Lane[] = [Lane.Left, Lane.Middle, Lane.Right];
        const occupiedLanes = new Set<Lane>();

        // Spawn one obstacle
        const obstacleType = [GameObjectType.Policajt, GameObjectType.Auto, GameObjectType.Barikada][Math.floor(Math.random() * 3)];
        const obstacleLane = lanes[Math.floor(Math.random() * 3)];
        const obstacleDef = OBJECT_DEFINITIONS[obstacleType];
        newObjects.push({
            id: Date.now() + Math.random(),
            type: obstacleType,
            lane: obstacleLane,
            position: [obstacleLane * laneWidth, obstacleDef.height / 2, Z_SPAWN_POSITION],
            ...obstacleDef
        });
        occupiedLanes.add(obstacleLane);
        if (obstacleType === GameObjectType.Barikada) {
            occupiedLanes.add(Lane.Left).add(Lane.Middle).add(Lane.Right);
        }

        // Spawn collectibles/powerups in remaining lanes
        const availableLanes = lanes.filter(l => !occupiedLanes.has(l));
        const numCollectibles = Math.floor(Math.random() * (availableLanes.length + 1));
        
        for (let i = 0; i < numCollectibles; i++) {
            const collectibleLaneIndex = Math.floor(Math.random() * availableLanes.length);
            const collectibleLane = availableLanes.splice(collectibleLaneIndex, 1)[0];
            
            const rand = Math.random();
            let type: GameObjectType;
            if (rand < 0.7) type = GameObjectType.Lajna;
            else if (rand < 0.85) type = GameObjectType.Cevko;
            else if (rand < 0.95) type = GameObjectType.SpeedBoost;
            else type = GameObjectType.Invincibility;
            
            const def = OBJECT_DEFINITIONS[type];
            newObjects.push({
                id: Date.now() + Math.random(),
                type,
                lane: collectibleLane,
                position: [collectibleLane * laneWidth, 1, Z_SPAWN_POSITION],
                ...def
            });
        }
        
        return { ...state, gameObjects: [...state.gameObjects, ...newObjects] };
    };

    const checkCollisions = (state: GameState): GameState => {
        let newState = { ...state };
        const currentPlayerBounds = newState.player.isSliding ? PLAYER_SLIDE_BOUNDS : PLAYER_BOUNDS;
        const playerPos = { x: newState.player.lane * laneWidth, y: currentPlayerBounds.height / 2, z: 0 };
        const isInvincible = newState.activePowerUps.some(p => p.type === GameObjectType.Invincibility);
        const objectsToKeep: GameObject[] = [];

        for (const obj of newState.gameObjects) {
            const dx = Math.abs(playerPos.x - obj.position[0]);
            const dy = Math.abs(playerPos.y - obj.position[1]);
            const dz = Math.abs(playerPos.z - obj.position[2]);

            const collisionX = dx * 2 < (currentPlayerBounds.width + obj.width);
            const collisionY = dy * 2 < (currentPlayerBounds.height + obj.height);
            const collisionZ = dz * 2 < (currentPlayerBounds.depth + obj.depth);

            if (collisionX && collisionY && collisionZ) {
                let shouldKeep = false;
                switch(obj.type) {
                    case GameObjectType.Lajna:
                        audioManager.playCollectSound();
                        newState.score += (OBJECT_DEFINITIONS[obj.type].score || 0) * (newState.player.isFlipping ? FLIP_SCORE_MULTIPLIER : 1);
                        break;
                    case GameObjectType.Cevko:
                        audioManager.playCollectSound();
                        newState.player.health = Math.min(MAX_HEALTH, newState.player.health + 1);
                        break;
                    case GameObjectType.SpeedBoost:
                    case GameObjectType.Invincibility:
                        audioManager.playPowerUpSound();
                        newState.activePowerUps = newState.activePowerUps.filter(p => p.type !== obj.type);
                        newState.activePowerUps.push({ type: obj.type, timeLeft: POWERUP_DURATION });
                        break;
                    default: // Obstacles
                        if (newState.player.isFlipping) {
                            audioManager.playDestroySound();
                            newState.score += 500;
                        } else if (newState.player.isSliding || isInvincible) {
                            shouldKeep = true;
                        } else {
                            audioManager.playDamageSound();
                            if(settings.haptics && navigator.vibrate) navigator.vibrate(200);
                            newState.player.health -= 1;
                            shouldKeep = true;
                        }
                        break;
                }

                if (shouldKeep) {
                    objectsToKeep.push(obj);
                }
            } else {
                objectsToKeep.push(obj);
            }
        }
        newState.gameObjects = objectsToKeep;
        return newState;
    };
    
    const gameLoop = useCallback((time: number) => {
        if (lastTimeRef.current === 0) {
            lastTimeRef.current = time;
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const deltaTime = (time - lastTimeRef.current) / 1000.0;
        lastTimeRef.current = time;

        setGameState(prev => {
            if (prev.status !== 'playing') {
                return prev;
            }

            let newState: GameState = { ...prev, player: {...prev.player}, gameObjects: [...prev.gameObjects], activePowerUps: [...prev.activePowerUps] };

            if (newState.player.health <= 0) {
                newState.status = 'gameOver';
                audioManager.playGameOverSound();
                onGameOver(Math.floor(newState.score));
                return newState;
            }
            
            // Update timers
            newState.player.flipCooldown = Math.max(0, newState.player.flipCooldown - 1);
            newState.player.slideCooldown = Math.max(0, newState.player.slideCooldown - 1);
            newState.activePowerUps = newState.activePowerUps
                .map(p => ({ ...p, timeLeft: p.timeLeft - 1 }))
                .filter(p => p.timeLeft > 0);

            // Flip logic
            if (newState.player.isFlipping) {
                newState.player.flipProgress += 1 / FLIP_DURATION;
                if (newState.player.flipProgress >= 1) {
                    newState.player.isFlipping = false;
                    newState.player.flipProgress = 0;
                }
            }

            // Slide logic
            if (newState.player.isSliding) {
                newState.player.slideProgress += 1 / SLIDE_DURATION;
                if (newState.player.slideProgress >= 1) {
                    newState.player.isSliding = false;
                    newState.player.slideProgress = 0;
                }
            }
            
            // Speed and score
            const isSpeedBoosted = newState.activePowerUps.some(p => p.type === GameObjectType.SpeedBoost);
            const currentSpeed = newState.gameSpeed * (isSpeedBoosted ? 1.5 : 1);

            if (newState.gameSpeed < MAX_GAME_SPEED) {
                newState.gameSpeed += SPEED_INCREASE_RATE;
            }
            const scoreMultiplier = newState.player.isFlipping ? FLIP_SCORE_MULTIPLIER : 1;
            newState.score += deltaTime * currentSpeed * scoreMultiplier;

            const distanceMoved = currentSpeed * deltaTime;
            distanceSinceLastSpawn.current += distanceMoved;
            
            // Move objects
            newState.gameObjects = newState.gameObjects
                .map(obj => ({ ...obj, position: [obj.position[0], obj.position[1], obj.position[2] + distanceMoved] as [number, number, number] }))
                .filter(obj => obj.position[2] < 20); // Despawn objects behind player

            // Spawn and collisions
            newState = spawnGameObjects(newState);
            newState = checkCollisions(newState);

            return newState;
        });

        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [onGameOver, settings.haptics]);

    useEffect(() => {
        if (gameState.status === 'playing') {
            lastTimeRef.current = performance.now();
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        } else {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        }

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameState.status, gameLoop]);
    
    useEffect(() => {
        audioManager.setVolume(settings.volume);
    }, [settings.volume]);

    return { gameState, movePlayer, triggerFlip, triggerSlide, pauseGame, resumeGame, resetGame };
};