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

    const isHighScore = score > 0 && (leaderboard.length < 5 || score > leaderboard[leaderboard.length - 1].score);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            addLeaderboardEntry(name.trim());
            setSubmitted(true);
        }
    };
    
    return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center glassmorphism p-4 screen-enter">
            <h2 className="text-6xl md:text-8xl font-black text-red-500 neon-text mb-4">GAME OVER</h2>
            <p className="text-lg text-cyan-300 neon-blue-text mb-8 text-center italic">"{getRandomQuote()}"</p>

            <div className="text-center mb-8">
                <p className="text-xl text-gray-400">Your Score</p>
                <p className="text-7xl font-bold text-white">{score}</p>
                <p className="text-md text-gray-400 mt-4">High Score: <span className="font-bold text-white">{highScore}</span></p>
            </div>

            {isHighScore && !submitted && (
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 mb-8 w-full max-w-xs">
                     <p className="text-lg text-yellow-400">New High Score! Enter your name:</p>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={10}
                        className="bg-gray-900 text-white text-center w-full p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        placeholder="PEDRO"
                    />
                    <Button type="submit">Submit Score</Button>
                </form>
            )}

            {(!isHighScore || submitted) && (
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <Button onClick={onRestart}>Play Again</Button>
                    <Button onClick={onMenu} variant="secondary">Main Menu</Button>
                </div>
            )}
        </div>
    );
};