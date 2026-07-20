import React, { useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GameScene3D } from './game3d/GameScene3D';
import { useGameLogic } from '../hooks/useGameLogic';
import { HUD } from './game3d/HUD';
import { PauseMenu } from './PauseMenu';
import { audioManager } from '../lib/audioManager';
import { Skin, Settings } from '../types';

interface GameScreenProps {
    onGameOver: (score: number) => void;
    onMenu: () => void;
    settings: Settings;
    skin: Skin;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onGameOver, onMenu, settings, skin }) => {
    const {
        gameState,
        movePlayer,
        triggerFlip,
        triggerSlide,
        pauseGame,
        resumeGame,
        resetGame,
    } = useGameLogic(onGameOver, settings);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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
                movePlayer('left');
            } else if (event.key === 'ArrowRight' || key === 'd') {
                event.preventDefault();
                movePlayer('right');
            } else if (event.key === ' ' || event.key === 'ArrowUp' || key === 'w') {
                event.preventDefault();
                triggerFlip();
            } else if (event.key === 'ArrowDown' || key === 's') {
                event.preventDefault();
                triggerSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState.status, handlePause, handleResume, movePlayer, triggerFlip, triggerSlide]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && gameState.status === 'playing') handlePause();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [gameState.status, handlePause]);

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length > 0) {
            touchStartRef.current = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
        }
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!touchStartRef.current || event.changedTouches.length === 0) return;

        const deltaX = event.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = event.changedTouches[0].clientY - touchStartRef.current.y;
        const swipeThreshold = 30;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
            movePlayer(deltaX > 0 ? 'right' : 'left');
        } else if (Math.abs(deltaY) > swipeThreshold) {
            if (deltaY < 0) triggerFlip();
            else triggerSlide();
        }

        touchStartRef.current = null;
    };

    return (
        <div
            className="game-surface w-full h-full relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <HUD gameState={gameState} onPause={handlePause} />
            <Canvas
                shadows
                dpr={[1, 1.5]}
                camera={{ position: [0, 4.45, 9.5], fov: 55 }}
                gl={{ antialias: false, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                    gl.shadowMap.type = THREE.PCFSoftShadowMap;
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.05;
                }}
                fallback={(
                    <div className="w-full h-full flex items-center justify-center p-6 text-center text-white bg-black">
                        Toto zařízení nepodporuje potřebné 3D zobrazení.
                    </div>
                )}
            >
                <GameScene3D gameState={gameState} settings={settings} skin={skin} />
            </Canvas>

            {gameState.status === 'paused' && (
                <PauseMenu onResume={handleResume} onRestart={handleRestart} onMenu={onMenu} />
            )}
        </div>
    );
};
