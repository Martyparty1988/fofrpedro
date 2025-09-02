import React from 'react';
import { Button } from './Button';

interface PauseMenuProps {
    onResume: () => void;
    onRestart: () => void;
    onMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onMenu }) => {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center glassmorphism fade-in">
            <h2 className="text-6xl font-black text-white neon-text mb-8">PAUSED</h2>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button onClick={onResume}>Resume</Button>
                <Button onClick={onRestart} variant="secondary">Restart</Button>
                <Button onClick={onMenu} variant="secondary">Main Menu</Button>
            </div>
        </div>
    );
};