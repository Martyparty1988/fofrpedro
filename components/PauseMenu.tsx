import React from 'react';
import { Button } from './Button';

interface PauseMenuProps {
    onResume: () => void;
    onRestart: () => void;
    onMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onMenu }) => {
    return (
        <div className="safe-screen absolute inset-0 z-20 flex flex-col items-center justify-center glassmorphism screen-enter">
            <h2 className="text-4xl sm:text-6xl text-center font-black text-white neon-text mb-8">PAUZA</h2>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button onClick={onResume}>Pokračovat</Button>
                <Button onClick={onRestart} variant="secondary">Restart</Button>
                <Button onClick={onMenu} variant="secondary">Hlavní menu</Button>
            </div>
        </div>
    );
};
