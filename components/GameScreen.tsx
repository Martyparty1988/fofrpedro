

import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene3D } from './game3d/GameScene3D';
import { useGameLogic } from '../hooks/useGameLogic';
import { HUD } from './HUD';
import { GameStatus, Skin, Settings } from '../types';

interface GameScreenProps {
    onPause: () => void;
    onGameOver: (score: number) => void;
    settings: Settings;
    skin: Skin;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onPause, onGameOver, settings, skin }) => {
    const { gameState, movePlayer, triggerFlip, triggerSlide } = useGameLogic(onGameOver, settings);
    
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);
    const lastTapRef = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
                movePlayer('left');
            } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
                movePlayer('right');
            } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
                triggerFlip();
            } else if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
                triggerSlide();
            } else if (e.key === 'Escape') {
                onPause();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [movePlayer, triggerFlip, triggerSlide, onPause]);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length > 0) {
            touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!touchStartRef.current) return;

        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        const dx = touchEnd.x - touchStartRef.current.x;
        const dy = touchEnd.y - touchStartRef.current.y;
        
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300; // ms

        if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
            if (Math.abs(dx) > 30) {
                if (dx > 0) movePlayer('right');
                else movePlayer('left');
            }
        } else { // Vertical swipe
            if (dy < -50) { // Swipe Up
                 if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
                    triggerFlip();
                    lastTapRef.current = 0; // Reset tap
                } else {
                    lastTapRef.current = now;
                }
            } else if (dy > 50) { // Swipe Down
                triggerSlide();
            }
        }
        touchStartRef.current = null;
    };


    return (
        <div className="w-full h-full relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <HUD gameState={gameState} onPause={onPause} />
            <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
                <GameScene3D gameState={gameState} settings={settings} skin={skin} />
            </Canvas>
        </div>
    );
};