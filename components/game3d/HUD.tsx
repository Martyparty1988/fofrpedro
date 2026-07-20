import React from 'react';
import { GameState, GameObjectType } from '../../types';
import { HeartIcon, SpeedIcon, ShieldIcon, FlipIcon, PauseIcon, SlideIcon } from '../../constants/assets';
import { POWERUP_DURATION, FLIP_COOLDOWN, FLIP_DURATION, SLIDE_COOLDOWN, SLIDE_DURATION } from '../../constants/gameConstants';

interface HUDProps {
    gameState: GameState;
    onPause: () => void;
}

const PowerUpIndicator: React.FC<{ type: GameObjectType.SpeedBoost | GameObjectType.Invincibility, timeLeft: number }> = ({ type, timeLeft }) => {
    const Icon = type === GameObjectType.SpeedBoost ? SpeedIcon : ShieldIcon;
    const progress = Math.max(0, Math.min(100, (timeLeft / POWERUP_DURATION) * 100));

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
    const maxCooldown = FLIP_COOLDOWN + FLIP_DURATION; 
    const isReady = cooldown <= 0.001;
    const progress = isReady ? 100 : Math.max(0, Math.min(100, ((maxCooldown - cooldown) / maxCooldown) * 100));
    
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
    const maxCooldown = SLIDE_COOLDOWN + SLIDE_DURATION;
    const isReady = cooldown <= 0.001;
    const progress = isReady ? 100 : Math.max(0, Math.min(100, ((maxCooldown - cooldown) / maxCooldown) * 100));
    
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
        <div className="game-hud absolute top-0 left-0 w-full h-full pointer-events-none text-white z-10 flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start">
                {/* Score and Speed */}
                <div className="flex flex-col items-start glassmorphism p-3 rounded-lg">
                    <span className="text-2xl sm:text-4xl font-black tracking-tighter leading-none">{Math.floor(gameState.score)}</span>
                    <span className="text-xs sm:text-sm text-gray-400">SKÓRE</span>
                    <span className="text-xs sm:text-sm text-cyan-300 mt-1">RYCHLOST: {gameState.gameSpeed.toFixed(1)}</span>
                </div>

                {/* Pause Button */}
                <button type="button" aria-label="Pozastavit hru" onClick={onPause} className="glassmorphism p-3 rounded-full pointer-events-auto hover:bg-white/20 transition">
                    <PauseIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-end">
                {/* Health */}
                <div className="flex gap-2 glassmorphism p-3 rounded-lg">
                    {Array.from({ length: gameState.player.health }).map((_, i) => (
                        <HeartIcon key={i} className={`w-6 h-6 sm:w-8 sm:h-8 text-red-500 ${gameState.player.damageCooldown > 0 ? 'animate-pulse' : ''}`} />
                    ))}
                    {Array.from({ length: 5 - gameState.player.health }).map((_, i) => (
                         <HeartIcon key={i} className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700" />
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
