import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameObject, Lane, PlayerState, GameObjectType, PowerUpState, GameEffect } from '../types';
import { audioManager } from '../lib/audioManager';
import { Settings } from '../types';
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
    PLAYER_BOUNDS,
    PLAYER_SLIDE_BOUNDS,
    OBJECT_DEFINITIONS,
    POWERUP_DURATION,
    EFFECT_LIFESPAN,
    Z_SPAWN_POSITION,
    SPAWN_INTERVAL,
    LANE_WIDTH,
} from '../constants/gameConstants';

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
        effects: [],
    };
}

export const useGameLogic = (onGameOver: (score: number) => void, settings: Settings) => {
    const [gameState, setGameState] = useState<GameState>(() => createInitialState());
    const gameLoopRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const distanceSinceLastSpawn = useRef(0);

    useEffect(() => {
        audioManager.playStartHlaska();
    }, []);

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
        
        if (settings.reducedMotion) {
            audioManager.playJumpHlaska();
        } else {
            audioManager.playFrontflipHlaska();
        }
        audioManager.playFlipSound();
        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, isFlipping: true, flipProgress: 0, flipCooldown: FLIP_COOLDOWN + FLIP_DURATION }
        }));
    }, [gameState.status, gameState.player.flipCooldown, gameState.player.isFlipping, gameState.player.isSliding, settings.reducedMotion]);
    
    const triggerSlide = useCallback(() => {
        if (gameState.status !== 'playing' || gameState.player.isSliding || gameState.player.isFlipping || gameState.player.slideCooldown > 0) return;
        
        audioManager.playSlideHlaska();
        audioManager.playSlideSound();
        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, isSliding: true, slideProgress: 0, slideCooldown: SLIDE_COOLDOWN + SLIDE_DURATION }
        }));
    }, [gameState.status, gameState.player.isSliding, gameState.player.isFlipping, gameState.player.slideCooldown]);


    const spawnGameObjects = (state: GameState): GameState => {

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
            position: [obstacleLane * LANE_WIDTH, obstacleDef.height / 2, Z_SPAWN_POSITION],
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
                position: [collectibleLane * LANE_WIDTH, 1, Z_SPAWN_POSITION],
                ...def
            });
        }
        
        return { ...state, gameObjects: [...state.gameObjects, ...newObjects] };
    };

    const checkCollisions = (state: GameState): GameState => {
        let newState = { ...state };
        const currentPlayerBounds = newState.player.isSliding ? PLAYER_SLIDE_BOUNDS : PLAYER_BOUNDS;
        const playerPos = { x: newState.player.lane * LANE_WIDTH, y: currentPlayerBounds.height / 2, z: 0 };
        const isInvincible = newState.activePowerUps.some(p => p.type === GameObjectType.Invincibility);
        const objectsToKeep: GameObject[] = [];
        const newEffects: GameEffect[] = [];

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
                        newEffects.push({ id: obj.id, type: 'lajna-collect', position: obj.position, createdAt: Date.now() });
                        break;
                    case GameObjectType.Cevko:
                        audioManager.playCollectSound();
                        newState.player.health = Math.min(MAX_HEALTH, newState.player.health + 1);
                        newEffects.push({ id: obj.id, type: 'cevko-collect', position: obj.position, createdAt: Date.now() });
                        break;
                    case GameObjectType.SpeedBoost:
                    case GameObjectType.Invincibility:
                        audioManager.playPowerUpHlaska();
                        audioManager.playPowerUpSound();
                        newState.activePowerUps = newState.activePowerUps.filter(p => p.type !== obj.type);
                        newState.activePowerUps.push({ type: obj.type, timeLeft: POWERUP_DURATION });
                        newEffects.push({ id: obj.id, type: 'powerup-collect', position: obj.position, createdAt: Date.now() });
                        break;
                    default: // Obstacles
                        if (newState.player.isFlipping) {
                            audioManager.playDestroySound();
                            newState.score += 500;
                        } else if (newState.player.isSliding || isInvincible) {
                            shouldKeep = true;
                        } else {
                            audioManager.playCollisionHlaska();
                            audioManager.playDamageSound();
                            if(settings.haptics && navigator.vibrate) navigator.vibrate(200);
                            newState.player.health -= 1;
                            newEffects.push({ id: obj.id, type: 'damage', position: [playerPos.x, playerPos.y, playerPos.z], createdAt: Date.now() });
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
        newState.effects = [...newState.effects, ...newEffects];
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
        const now = Date.now();

        setGameState(prev => {
            if (prev.status !== 'playing') {
                return prev;
            }

            let newState: GameState = { ...prev, player: {...prev.player}, gameObjects: [...prev.gameObjects], activePowerUps: [...prev.activePowerUps], effects: [...prev.effects] };

            if (newState.player.health <= 0) {
                newState.status = 'gameOver';
                audioManager.playGameOverHlaska();
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
            
            // Cleanup old effects
            newState.effects = newState.effects.filter(effect => now - effect.createdAt < EFFECT_LIFESPAN);


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