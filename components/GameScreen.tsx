

import React, { useEffect, useRef } from 'react';
// FIX: Add `extend` from R3F and import `three` to make all THREE objects available as JSX elements.
// This is required for some React Three Fiber setups (especially older versions) and will fix all 
// "Property does not exist on type 'JSX.IntrinsicElements'" errors throughout the 3D components.
import { Canvas, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { GameScene3D } from './game3d/GameScene3D';
import { useGameLogic } from '../hooks/useGameLogic';
import { HUD } from './game3d/HUD';
import { GameStatus, Skin, Settings } from '../types';

// This call makes all of Three.js available as JSX components
// FIX: Cast THREE to `any` to resolve a TypeScript error where the `THREE` namespace
// contains non-constructor properties, which the `extend` function's signature doesn't allow.
// This preserves the original intent of making all THREE components available in JSX.
extend(THREE as any);

interface GameScreenProps {
    onPause: () => void;
    onGameOver: (score: number) => void;
    settings: Settings;
    skin: Skin;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onPause, onGameOver, settings, skin }) => {
    const { gameState, movePlayer, triggerFlip, triggerSlide } = useGameLogic(onGameOver, settings);
    
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

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
        
        const swipeThreshold = 30;

        if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
            if (Math.abs(dx) > swipeThreshold) {
                if (dx > 0) movePlayer('right');
                else movePlayer('left');
            }
        } else { // Vertical swipe
            if (Math.abs(dy) > swipeThreshold) {
                if (dy < 0) { // Swipe Up
                    triggerFlip();
                } else { // Swipe Down
                    triggerSlide();
                }
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