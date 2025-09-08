import React from 'react';
import { Button } from './Button';

interface MainMenuProps {
    onStart: () => void;
    onSettings: () => void;
    onLeaderboard: () => void;
    onSkins: () => void;
    highScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, onSettings, onLeaderboard, onSkins, highScore }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black bg-opacity-80 p-8 screen-enter">
            <h1 className="text-7xl md:text-9xl font-black mb-4 text-white neon-text uppercase tracking-widest">
                Pedro Run
            </h1>
            <p className="text-xl md:text-2xl text-cyan-300 neon-blue-text mb-12">
                A Cyberpunk Prague Adventure
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button onClick={onStart}>Start Game</Button>
                <Button onClick={onSkins} variant="secondary">Skins</Button>
                <Button onClick={onLeaderboard} variant="secondary">Leaderboard</Button>
                <Button onClick={onSettings} variant="secondary">Settings</Button>
            </div>
             <p className="mt-8 text-lg text-gray-400">High Score: <span className="font-bold text-white">{highScore}</span></p>

            <div className="mt-8 text-center text-gray-400 text-sm glassmorphism p-4 rounded-lg w-full max-w-md">
                <h3 className="font-bold text-white mb-2 uppercase">Controls</h3>
                <div className="flex justify-around">
                    <div>
                        <p className="font-semibold">Desktop</p>
                        <p><span className="font-mono text-cyan-300">←</span> / <span className="font-mono text-cyan-300">→</span> : Move</p>
                        <p><span className="font-mono text-cyan-300">↑</span> / <span className="font-mono text-cyan-300">Space</span> : Flip</p>
                         <p><span className="font-mono text-cyan-300">↓</span> : Slide</p>
                    </div>
                     <div>
                        <p className="font-semibold">Mobile</p>
                        <p>Swipe Left/Right</p>
                        <p>Swipe Up</p>
                        <p>Swipe Down</p>
                    </div>
                </div>
            </div>
        </div>
    );
};