

import React from 'react';
import { GameState, GameObjectType } from '../types';
import { HeartIcon, SpeedIcon, ShieldIcon, FlipIcon, PauseIcon, SlideIcon } from '../constants/assets';

interface HUDProps {
    gameState: GameState;
    onPause: () => void;
}

const PowerUpIndicator: React.FC<{ type: GameObjectType.SpeedBoost | GameObjectType.Invincibility, timeLeft: number }> = ({ type, timeLeft }) => {
    const Icon = type === GameObjectType.SpeedBoost ? SpeedIcon : ShieldIcon;
    const duration = 300; // Corresponds to POWERUP_DURATION in useGameLogic
    const progress = (timeLeft / duration) * 100;

    return (
        <div className="flex items-center gap-2 glassmorphism p-2 rounded-lg">
            <Icon className="w-6 h-6 text-cyan-300" />
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

const FlipIndicator: React.FC<{ cooldown: number }> = ({ cooldown }) => {
    // FIX: Corrected maxCooldown to match the game logic (FLIP_COOLDOWN + FLIP_DURATION = 54 + 30 = 84).
    const maxCooldown = 84; 
    const isReady = cooldown === 0;
    const progress = isReady ? 100 : ((maxCooldown - cooldown) / maxCooldown) * 100;
    
    return (
        <div className={`flex items-center gap-2 glassmorphism p-2 rounded-lg transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-60'}`}>
            <FlipIcon className={`w-6 h-6 ${isReady ? 'text-fuchsia-400 animate-pulse' : 'text-gray-400'}`} />
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${isReady ? 'bg-fuchsia-500' : 'bg-gray-500'}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

const SlideIndicator: React.FC<{ cooldown: number }> = ({ cooldown }) => {
    const maxCooldown = 60; // SLIDE_DURATION + SLIDE_COOLDOWN
    const isReady = cooldown === 0;
    const progress = isReady ? 100 : ((maxCooldown - cooldown) / maxCooldown) * 100;
    
    return (
        <div className={`flex items-center gap-2 glassmorphism p-2 rounded-lg transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-60'}`}>
            <SlideIcon className={`w-6 h-6 ${isReady ? 'text-cyan-400 animate-pulse' : 'text-gray-400'}`} />
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${isReady ? 'bg-cyan-500' : 'bg-gray-500'}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};


export const HUD: React.FC<HUDProps> = ({ gameState, onPause }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full p-4 md:p-6 pointer-events-none text-white z-10 flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start">
                {/* Score and Speed */}
                <div className="flex flex-col items-start glassmorphism p-3 rounded-lg">
                    <span className="text-4xl font-black tracking-tighter leading-none">{Math.floor(gameState.score)}</span>
                    <span className="text-sm text-gray-400">SCORE</span>
                    <span className="text-sm text-cyan-300 mt-1">SPEED: {gameState.gameSpeed.toFixed(1)}</span>
                </div>

                {/* Pause Button */}
                <button onClick={onPause} className="glassmorphism p-3 rounded-full pointer-events-auto hover:bg-white/20 transition">
                    <PauseIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-end">
                {/* Health */}
                <div className="flex gap-2 glassmorphism p-3 rounded-lg">
                    {Array.from({ length: gameState.player.health }).map((_, i) => (
                        <HeartIcon key={i} className="w-8 h-8 text-red-500" />
                    ))}
                    {Array.from({ length: 5 - gameState.player.health }).map((_, i) => (
                         <HeartIcon key={i} className="w-8 h-8 text-gray-700" />
                    ))}
                </div>

                {/* Powerups & Cooldowns */}
                <div className="flex flex-col items-end gap-2">
                    <FlipIndicator cooldown={gameState.player.flipCooldown} />
                    <SlideIndicator cooldown={gameState.player.slideCooldown} />
                    {gameState.activePowerUps.map(p => (
                        <PowerUpIndicator key={p.type} type={p.type} timeLeft={p.timeLeft} />
                    ))}
                </div>
            </div>
        </div>
    );
};