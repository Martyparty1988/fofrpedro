import React from 'react';
import { LeaderboardEntry } from '../types';
import { Button } from './Button';

interface LeaderboardScreenProps {
    scores: LeaderboardEntry[];
    onBack: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ scores, onBack }) => {
    return (
        <div className="safe-screen absolute inset-0 z-20 overflow-y-auto flex flex-col items-center justify-start md:justify-center glassmorphism screen-enter">
            <h2 className="mt-4 md:mt-0 text-3xl sm:text-5xl text-center font-black text-white neon-text mb-8">ŽEBŘÍČEK</h2>

            <div className="w-full max-w-lg flex flex-col gap-3">
                {scores.length > 0 ? (
                    scores.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center glassmorphism p-4 rounded-lg text-lg">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-xl w-6 text-cyan-300">{index + 1}.</span>
                                <span className="font-semibold text-white">{entry.name}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="font-bold text-xl text-fuchsia-400">{entry.score}</span>
                                <span className="text-xs text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400 text-lg">Zatím tu není žádné skóre. Běž vytvořit rekord!</p>
                )}
            </div>
            
            <div className="mt-12 w-full max-w-md">
                 <Button onClick={onBack} variant="primary">Zpět do menu</Button>
            </div>
        </div>
    );
};
