import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { GameScene3D, SceneQuality } from './game3d/GameScene3D';
import { useGameLogic } from '../hooks/useGameLogic';
import { HUD } from './game3d/HUD';
import { PauseMenu } from './PauseMenu';
import { audioManager } from '../lib/audioManager';
import { RunSummary, Settings, Skin } from '../types';

interface GameScreenProps {
    onGameOver: (summary: RunSummary) => void;
    onMenu: () => void;
    settings: Settings;
    skin: Skin;
}

const TUTORIAL_KEY = 'pedro-run-tutorial-v2';

const getInitialQuality = (settings: Settings): SceneQuality => {
    if (settings.quality !== 'auto') return settings.quality;
    if (typeof navigator === 'undefined') return 'balanced';
    const memory = 'deviceMemory' in navigator ? Number(navigator.deviceMemory) : 4;
    const cores = navigator.hardwareConcurrency || 4;
    return memory <= 4 || cores <= 4 ? 'low' : 'balanced';
};

export const GameScreen: React.FC<GameScreenProps> = ({ onGameOver, onMenu, settings, skin }) => {
    const { gameState, movePlayer, triggerFlip, triggerSlide, pauseGame, resumeGame, resetGame } = useGameLogic(onGameOver, settings);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const [quality, setQuality] = useState<SceneQuality>(() => getInitialQuality(settings));
    const [showTutorial, setShowTutorial] = useState(() => {
        try {
            return localStorage.getItem(TUTORIAL_KEY) !== 'seen';
        } catch {
            return true;
        }
    });

    useEffect(() => setQuality(getInitialQuality(settings)), [settings]);

    const markTutorialSeen = useCallback(() => {
        if (!showTutorial) return;
        setShowTutorial(false);
        try {
            localStorage.setItem(TUTORIAL_KEY, 'seen');
        } catch {
            // The hint can safely reappear when storage is unavailable.
        }
    }, [showTutorial]);

    useEffect(() => {
        if (!showTutorial || gameState.status !== 'playing') return;
        const timeout = window.setTimeout(markTutorialSeen, 6500);
        return () => window.clearTimeout(timeout);
    }, [gameState.status, markTutorialSeen, showTutorial]);

    const handlePause = useCallback(() => {
        pauseGame();
        audioManager.stopMusic();
    }, [pauseGame]);

    const handleResume = useCallback(() => {
        resumeGame();
        audioManager.startMusic();
    }, [resumeGame]);

    const handleRestart = useCallback(() => {
        resetGame();
        audioManager.startMusic();
    }, [resetGame]);

    const actions = useMemo(() => ({
        left: () => { movePlayer('left'); markTutorialSeen(); },
        right: () => { movePlayer('right'); markTutorialSeen(); },
        flip: () => { triggerFlip(); markTutorialSeen(); },
        slide: () => { triggerSlide(); markTutorialSeen(); },
    }), [markTutorialSeen, movePlayer, triggerFlip, triggerSlide]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                if (gameState.status === 'paused') handleResume();
                else if (gameState.status === 'playing') handlePause();
                return;
            }
            if (gameState.status !== 'playing') return;
            const key = event.key.toLowerCase();
            if (event.key === 'ArrowLeft' || key === 'a') {
                event.preventDefault();
                actions.left();
            } else if (event.key === 'ArrowRight' || key === 'd') {
                event.preventDefault();
                actions.right();
            } else if (event.key === ' ' || event.key === 'ArrowUp' || key === 'w') {
                event.preventDefault();
                actions.flip();
            } else if (event.key === 'ArrowDown' || key === 's') {
                event.preventDefault();
                actions.slide();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [actions, gameState.status, handlePause, handleResume]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && gameState.status === 'playing') handlePause();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [gameState.status, handlePause]);

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 1) touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!touchStartRef.current || event.changedTouches.length === 0 || gameState.status !== 'playing') return;
        const deltaX = event.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = event.changedTouches[0].clientY - touchStartRef.current.y;
        const threshold = 30;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
            deltaX > 0 ? actions.right() : actions.left();
        } else if (Math.abs(deltaY) > threshold) {
            deltaY < 0 ? actions.flip() : actions.slide();
        }
        touchStartRef.current = null;
    };

    const declineQuality = useCallback(() => {
        if (settings.quality !== 'auto') return;
        setQuality(current => current === 'high' ? 'balanced' : 'low');
    }, [settings.quality]);

    const increaseQuality = useCallback(() => {
        if (settings.quality !== 'auto') return;
        setQuality(current => current === 'low' ? 'balanced' : current);
    }, [settings.quality]);

    const dpr: [number, number] = quality === 'high' ? [1, 1.75] : quality === 'balanced' ? [1, 1.4] : [0.85, 1.1];

    return (
        <div
            className="game-surface relative h-full w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => { touchStartRef.current = null; }}
        >
            <HUD gameState={gameState} onPause={handlePause} />
            <Canvas
                shadows={quality !== 'low'}
                dpr={dpr}
                frameloop={gameState.status === 'paused' ? 'demand' : 'always'}
                camera={{ position: [0, 4.45, 9.5], fov: 55 }}
                gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
                onCreated={({ gl }) => {
                    gl.shadowMap.type = THREE.PCFSoftShadowMap;
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.05;
                }}
                fallback={<div className="grid h-full place-items-center bg-black p-6 text-center text-white">Toto zařízení nepodporuje potřebné 3D zobrazení.</div>}
            >
                {settings.quality === 'auto' && (
                    <PerformanceMonitor flipflops={3} onDecline={declineQuality} onIncline={increaseQuality} />
                )}
                <GameScene3D gameState={gameState} settings={settings} skin={skin} quality={quality} />
            </Canvas>

            {gameState.status === 'countdown' && (
                <div className="countdown-overlay" role="status" aria-live="assertive">
                    <span className="countdown-overlay__eyebrow">PŘIPRAV SE</span>
                    <strong key={gameState.countdown}>{gameState.countdown > 0 ? gameState.countdown : 'BĚŽ'}</strong>
                </div>
            )}

            {showTutorial && (gameState.status === 'countdown' || gameState.status === 'playing') && (
                <div className="tutorial-hint" role="note">
                    <span>← → změna pruhu</span>
                    <span>↑ salto</span>
                    <span>↓ skluz</span>
                </div>
            )}

            {gameState.status === 'gameOver' && (
                <div className="crash-overlay" role="status">
                    <span>SIGNÁL ZTRACEN</span>
                </div>
            )}

            {gameState.status === 'paused' && (
                <PauseMenu onResume={handleResume} onRestart={handleRestart} onMenu={onMenu} />
            )}
        </div>
    );
};
