import React, { useState } from 'react';
import { Button } from './Button';
import { getRandomQuote } from '../constants/content';
import { LeaderboardEntry } from '../types';

interface GameOverScreenProps {
    score: number;
    highScore: number;
    onRestart: () => void;
    onMenu: () => void;
    addLeaderboardEntry: (name: string) => void;
    leaderboard: LeaderboardEntry[];
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, highScore, onRestart, onMenu, addLeaderboardEntry, leaderboard }) => {
    const [name, setName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [quote] = useState(getRandomQuote);

    const isHighScore = score > 0 && (leaderboard.length < 5 || score > leaderboard[leaderboard.length - 1].score);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            addLeaderboardEntry(name.trim());
            setSubmitted(true);
        }
    };
    
    return (
        <div className="safe-screen absolute inset-0 z-20 overflow-y-auto flex flex-col items-center justify-start md:justify-center glassmorphism screen-enter">
            <h2 className="mt-4 md:mt-0 text-4xl sm:text-6xl md:text-8xl text-center font-black text-red-500 neon-text mb-4">KONEC HRY</h2>
            <p className="text-sm sm:text-lg text-cyan-300 neon-blue-text mb-5 md:mb-8 text-center italic">"{quote}"</p>

            <div className="text-center mb-8">
                <p className="text-lg sm:text-xl text-gray-400">Tvoje skóre</p>
                <p className="text-5xl sm:text-7xl font-bold text-white">{score}</p>
                <p className="text-md text-gray-400 mt-3">Rekord: <span className="font-bold text-white">{highScore}</span></p>
            </div>

            {isHighScore && !submitted && (
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mb-8 w-full max-w-xs">
                     <p className="text-lg text-center text-yellow-400">Nový rekord! Zadej své jméno:</p>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={10}
                        aria-label="Jméno do žebříčku"
                        className="bg-gray-900 text-white text-center w-full p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        placeholder="PEDRO"
                    />
                    <Button type="submit">Uložit skóre</Button>
                </form>
            )}

            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button onClick={onRestart}>Hrát znovu</Button>
                <Button onClick={onMenu} variant="secondary">Hlavní menu</Button>
            </div>
        </div>
    );
};
