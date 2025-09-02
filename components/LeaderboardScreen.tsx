import React from 'react';
import { LeaderboardEntry } from '../types';
import { Button } from './Button';

interface LeaderboardScreenProps {
    scores: LeaderboardEntry[];
    onBack: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ scores, onBack }) => {
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center glassmorphism p-4 fade-in">
            <h2 className="text-5xl font-black text-white neon-text mb-8">LEADERBOARD</h2>

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
                    <p className="text-center text-gray-400 text-lg">No scores yet. Go set a new record!</p>
                )}
            </div>
            
            <div className="mt-12 w-full max-w-md">
                 <Button onClick={onBack} variant="primary">Back to Menu</Button>
            </div>
        </div>
    );
};