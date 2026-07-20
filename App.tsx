
import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { GameStatus, Skin, LeaderboardEntry, Settings } from './types';
import { MainMenu } from './components/MainMenu';
import { GameOverScreen } from './components/GameOverScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import {
    getSettings,
    saveSettings,
    getSelectedSkin,
    saveSelectedSkin,
    getLeaderboard,
    saveLeaderboard,
    getHighScore,
    saveHighScore,
} from './lib/storageManager';
import { SKINS } from './constants/skins';
import { audioManager } from './lib/audioManager';

const GameScreen = lazy(() => import('./components/GameScreen').then(module => ({ default: module.GameScreen })));
const SkinsScreen = lazy(() => import('./components/SkinsScreen').then(module => ({ default: module.SkinsScreen })));

const App: React.FC = () => {
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MainMenu);
    const [lastScore, setLastScore] = useState(0);
    const [highScore, setHighScore] = useState(getHighScore);
    const [settings, setSettings] = useState<Settings>(getSettings);
    const [selectedSkin, setSelectedSkin] = useState<Skin>(getSelectedSkin);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(getLeaderboard);
    
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    useEffect(() => {
        saveSelectedSkin(selectedSkin);
    }, [selectedSkin]);

    useEffect(() => {
        saveLeaderboard(leaderboard);
    }, [leaderboard]);

    useEffect(() => {
        saveHighScore(highScore);
    }, [highScore]);
    
    const handleStartGame = useCallback(() => {
        setGameStatus(GameStatus.Playing);
        audioManager.startMusic();
    }, []);
    const handleRestart = useCallback(() => {
        setGameStatus(GameStatus.Playing);
        audioManager.startMusic();
    }, []);
    const handleGoToMenu = useCallback(() => {
        setGameStatus(GameStatus.MainMenu);
        audioManager.stopMusic();
    }, []);
    const handleOpenSettings = useCallback(() => setGameStatus(GameStatus.Settings), []);
    const handleOpenLeaderboard = useCallback(() => setGameStatus(GameStatus.Leaderboard), []);
    const handleOpenSkins = useCallback(() => setGameStatus(GameStatus.Skins), []);

    const handleGameOver = useCallback((score: number) => {
        setLastScore(score);
        setHighScore(currentHighScore => Math.max(currentHighScore, score));
        setGameStatus(GameStatus.GameOver);
        audioManager.stopMusic();
    }, []);
    
    const addLeaderboardEntry = (name: string) => {
        const newEntry: LeaderboardEntry = { name, score: lastScore, date: new Date().toISOString() };
        const updatedLeaderboard = [...leaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        setLeaderboard(updatedLeaderboard);
    };

    const renderScreen = () => {
        switch (gameStatus) {
            case GameStatus.MainMenu:
                return <MainMenu 
                    onStart={handleStartGame} 
                    onSettings={handleOpenSettings}
                    onLeaderboard={handleOpenLeaderboard}
                    onSkins={handleOpenSkins}
                    highScore={highScore}
                />;
            case GameStatus.Playing:
                return <GameScreen 
                    onGameOver={handleGameOver}
                    onMenu={handleGoToMenu}
                    settings={settings}
                    skin={selectedSkin}
                />;
            case GameStatus.GameOver:
                return <GameOverScreen 
                    score={lastScore} 
                    highScore={highScore} 
                    onRestart={handleRestart} 
                    onMenu={handleGoToMenu}
                    addLeaderboardEntry={addLeaderboardEntry}
                    leaderboard={leaderboard}
                />;
            case GameStatus.Settings:
                 return <SettingsScreen settings={settings} setSettings={setSettings} onBack={handleGoToMenu} />;
            case GameStatus.Leaderboard:
                return <LeaderboardScreen scores={leaderboard} onBack={handleGoToMenu} />;
            case GameStatus.Skins:
                return <SkinsScreen skins={SKINS} selectedSkin={selectedSkin} onSelectSkin={setSelectedSkin} onBack={handleGoToMenu} />;
            default:
                return <MainMenu 
                    onStart={handleStartGame} 
                    onSettings={handleOpenSettings}
                    onLeaderboard={handleOpenLeaderboard}
                    onSkins={handleOpenSkins}
                    highScore={highScore}
                />;
        }
    };

    return (
        <div className="w-full h-full bg-black">
            <Suspense fallback={<div className="grid h-full w-full place-items-center bg-black text-cyan-300">Načítání…</div>}>
                {renderScreen()}
            </Suspense>
        </div>
    );
};

export default App;
