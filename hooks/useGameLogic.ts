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
import { hlasky, HlaskaCategory } from '../constants/hlasky';


// --- New Spawning Pattern Definitions ---

// A pattern is a description of what to spawn in each lane.
// `null` means the lane is available for collectibles.
type ObstaclePattern = (GameObjectType | null)[];

interface PatternDefinition {
    pattern: ObstaclePattern;
    minScore: number;
    weight: number; // How likely is this pattern to be chosen relative to others
}

// Patterns become available as the player's score increases.
const PATTERNS: PatternDefinition[] = [
    // Score 0+ (Easy)
    { pattern: [GameObjectType.Policajt, null, null], minScore: 0, weight: 10 },
    { pattern: [null, GameObjectType.Policajt, null], minScore: 0, weight: 10 },
    { pattern: [null, null, GameObjectType.Policajt], minScore: 0, weight: 10 },

    // Score 2000+
    { pattern: [GameObjectType.Auto, null, null], minScore: 2000, weight: 8 },
    { pattern: [null, GameObjectType.Auto, null], minScore: 2000, weight: 8 },
    { pattern: [null, null, GameObjectType.Auto], minScore: 2000, weight: 8 },

    // Score 5000+ (Medium)
    { pattern: [GameObjectType.Policajt, GameObjectType.Policajt, null], minScore: 5000, weight: 5 },
    { pattern: [null, GameObjectType.Policajt, GameObjectType.Policajt], minScore: 5000, weight: 5 },
    
    // Score 7000+
    { pattern: [GameObjectType.Policajt, null, GameObjectType.Policajt], minScore: 7000, weight: 4 },
    
    // Score 10000+ (Hard)
    { pattern: [GameObjectType.Auto, null, GameObjectType.Policajt], minScore: 10000, weight: 3 },
    { pattern: [GameObjectType.Policajt, null, GameObjectType.Auto], minScore: 10000, weight: 3 },
    
    // Score 15000+
    { pattern: [GameObjectType.Barikada, null, null], minScore: 15000, weight: 5 }, // A single barricade
    
    // Score 20000+
    { pattern: [GameObjectType.Auto, GameObjectType.Auto, null], minScore: 20000, weight: 2 },
    { pattern: [GameObjectType.Policajt, GameObjectType.Auto, GameObjectType.Policajt], minScore: 22000, weight: 1 },

    // Score 25000+ (Expert) - The Wall!
    { pattern: [GameObjectType.Barikada, GameObjectType.Barikada, GameObjectType.Barikada], minScore: 25000, weight: 2},
];


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
    const lastUsedHlasky = useRef<string[]>([]);
    const scoreMilestone = useRef(10000);

    const addSpeechBubble = useCallback((state: GameState, category: HlaskaCategory): GameState => {
        // Prevent spamming bubbles
        if (state.effects.some(e => e.type === 'speech-bubble')) {
            return state;
        }

        const lines = hlasky[category];
        if (!lines || lines.length === 0) return state;

        // Filter out recently used lines to avoid repetition
        const availableLines = lines.filter(line => !lastUsedHlasky.current.includes(line));
        const linesToUse = availableLines.length > 5 ? availableLines : lines; // Use filtered list if it's large enough
        
        const text = linesToUse[Math.floor(Math.random() * linesToUse.length)];

        // Update recently used list
        lastUsedHlasky.current.push(text);
        if (lastUsedHlasky.current.length > 5) { // Keep history of last 5 quotes
            lastUsedHlasky.current.shift();
        }

        const newEffect: GameEffect = {
            id: Date.now() + Math.random(),
            type: 'speech-bubble',
            position: [state.player.lane * LANE_WIDTH, 3.5, 0], // Lowered position for better visibility
            createdAt: Date.now(),
            text: text,
        };
        
        return { ...state, effects: [...state.effects, newEffect] };
    }, []);

    useEffect(() => {
        setGameState(prev => addSpeechBubble(prev, 'start'));
    }, [addSpeechBubble]);

    const resetGame = useCallback(() => {
        setGameState(createInitialState());
        distanceSinceLastSpawn.current = 0;
        lastUsedHlasky.current = [];
        scoreMilestone.current = 10000;
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
        setGameState(prev => {
            let newState = {
                ...prev,
                player: { ...prev.player, isFlipping: true, flipProgress: 0, flipCooldown: FLIP_COOLDOWN + FLIP_DURATION }
            };
            const category = settings.reducedMotion ? 'jump' : 'frontflip';
            return addSpeechBubble(newState, category);
        });
    }, [gameState.status, gameState.player, settings.reducedMotion, addSpeechBubble]);
    
    const triggerSlide = useCallback(() => {
        if (gameState.status !== 'playing' || gameState.player.isSliding || gameState.player.isFlipping || gameState.player.slideCooldown > 0) return;
        
        audioManager.playSlideSound();
        setGameState(prev => {
            let newState = {
                ...prev,
                player: { ...prev.player, isSliding: true, slideProgress: 0, slideCooldown: SLIDE_COOLDOWN + SLIDE_DURATION }
            };
            return addSpeechBubble(newState, 'slide');
        });
    }, [gameState.status, gameState.player, addSpeechBubble]);


    const spawnGameObjects = (state: GameState): GameState => {
        if (distanceSinceLastSpawn.current < SPAWN_INTERVAL) {
            return state;
        }
        distanceSinceLastSpawn.current = 0;

        const newObjects: GameObject[] = [];
        const lanes: Lane[] = [Lane.Left, Lane.Middle, Lane.Right];
        const availableLanesForCollectibles: Lane[] = [...lanes];

        // --- 1. Select a pattern based on score ---
        const eligiblePatterns = PATTERNS.filter(p => state.score >= p.minScore);
        const totalWeight = eligiblePatterns.reduce((sum, p) => sum + p.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        const chosenPatternDef = eligiblePatterns.find(p => {
            randomWeight -= p.weight;
            return randomWeight <= 0;
        }) || eligiblePatterns[eligiblePatterns.length - 1]; // Fallback to last pattern

        // --- 2. Shuffle pattern and spawn obstacles ---
        const chosenPattern = [...chosenPatternDef.pattern]; // Create a mutable copy
        // Fisher-Yates shuffle for variety
        for (let i = chosenPattern.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chosenPattern[i], chosenPattern[j]] = [chosenPattern[j], chosenPattern[i]];
        }
        
        // Handle Barikada special rule: it prevents collectibles from spawning nearby
        const hasBarikada = chosenPattern.some(type => type === GameObjectType.Barikada);
        if (hasBarikada) {
            availableLanesForCollectibles.length = 0;
        }

        chosenPattern.forEach((type, index) => {
            if (type !== null) {
                const lane = lanes[index];
                const def = OBJECT_DEFINITIONS[type];
                newObjects.push({
                    id: Date.now() + Math.random(),
                    type,
                    lane,
                    position: [lane * LANE_WIDTH, def.height / 2, Z_SPAWN_POSITION],
                    ...def,
                });

                // If not a Barikada wave, mark this lane as occupied for collectibles
                if (!hasBarikada) {
                    const laneIndex = availableLanesForCollectibles.indexOf(lane);
                    if (laneIndex > -1) {
                        availableLanesForCollectibles.splice(laneIndex, 1);
                    }
                }
            }
        });

        // --- 3. Spawn collectibles/powerups in remaining empty lanes ---
        const numCollectibles = Math.floor(Math.random() * (availableLanesForCollectibles.length + 1));
        const shuffledCollectibleLanes = availableLanesForCollectibles.sort(() => 0.5 - Math.random());

        for (let i = 0; i < numCollectibles; i++) {
            const lane = shuffledCollectibleLanes[i];
            
            const rand = Math.random();
            let collectibleType: GameObjectType;
            if (rand < 0.7) collectibleType = GameObjectType.Lajna;
            else if (rand < 0.85) collectibleType = GameObjectType.Cevko;
            else if (rand < 0.95) collectibleType = GameObjectType.SpeedBoost;
            else collectibleType = GameObjectType.Invincibility;
            
            const def = OBJECT_DEFINITIONS[collectibleType];
            newObjects.push({
                id: Date.now() + Math.random(),
                type: collectibleType,
                lane,
                position: [lane * LANE_WIDTH, 1, Z_SPAWN_POSITION],
                ...def,
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
                        audioManager.playPowerUpSound();
                        newState = addSpeechBubble(newState, 'powerup');
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
                            audioManager.playDamageSound();
                            newState = addSpeechBubble(newState, 'collision');
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
                newState = addSpeechBubble(newState, 'gameover');
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
            newState.effects = newState.effects.filter(effect => {
                const lifespan = effect.type === 'speech-bubble' ? 3000 : EFFECT_LIFESPAN;
                return now - effect.createdAt < lifespan;
            });


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

            // Check for score milestone for "ultimate" quote
            if (newState.score >= scoreMilestone.current) {
                newState = addSpeechBubble(newState, 'pedroultimate');
                scoreMilestone.current += 10000; // Set next milestone
            }

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
    }, [onGameOver, settings.haptics, addSpeechBubble]);

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