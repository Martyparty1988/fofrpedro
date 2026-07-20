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
        <div className="safe-screen w-full h-full overflow-y-auto flex flex-col items-center justify-start md:justify-center bg-black bg-opacity-80 screen-enter">
            <h1 className="mt-4 md:mt-0 text-5xl sm:text-7xl md:text-9xl text-center font-black mb-3 text-white neon-text uppercase tracking-wider md:tracking-widest">
                Pedro Run
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-center text-cyan-300 neon-blue-text mb-6 md:mb-10">
                Kyberpunkové dobrodružství v Praze
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button onClick={onStart}>Hrát</Button>
                <Button onClick={onSkins} variant="secondary">Vzhledy</Button>
                <Button onClick={onLeaderboard} variant="secondary">Žebříček</Button>
                <Button onClick={onSettings} variant="secondary">Nastavení</Button>
            </div>
             <p className="mt-6 text-lg text-gray-400">Rekord: <span className="font-bold text-white">{highScore}</span></p>

            <div className="mt-6 text-center text-gray-400 text-xs sm:text-sm glassmorphism p-4 rounded-lg w-full max-w-md">
                <h3 className="font-bold text-white mb-2 uppercase">Ovládání</h3>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-around">
                    <div>
                        <p className="font-semibold text-white">Počítač</p>
                        <p><span className="font-mono text-cyan-300">←</span> / <span className="font-mono text-cyan-300">→</span> : pohyb</p>
                        <p><span className="font-mono text-cyan-300">↑</span> / <span className="font-mono text-cyan-300">mezerník</span> : salto</p>
                         <p><span className="font-mono text-cyan-300">↓</span> : skluz</p>
                    </div>
                     <div>
                        <p className="font-semibold text-white">Mobil</p>
                        <p>Přejeď doleva/doprava</p>
                        <p>Přejeď nahoru</p>
                        <p>Přejeď dolů</p>
                    </div>
                </div>
            </div>
            <p className="mt-4 pb-2 text-[10px] sm:text-xs text-gray-600 text-center">Drsný humor a narážky na návykové látky · 18+</p>
        </div>
    );
};
