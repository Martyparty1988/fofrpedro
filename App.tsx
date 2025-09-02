
import React, { useState, useEffect, useCallback } from 'react';
import { GameStatus, Skin, LeaderboardEntry, Settings } from './types';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { PauseMenu } from './components/PauseMenu';
import { GameOverScreen } from './components/GameOverScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { SkinsScreen } from './components/SkinsScreen';
import { getSettings, saveSettings, getSelectedSkin, saveSelectedSkin, getLeaderboard, saveLeaderboard } from './lib/storageManager';
import { SKINS } from './constants/assets';

const App: React.FC = () => {
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MainMenu);
    const [lastScore, setLastScore] = useState(0);
    const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('highScore') || '0'));
    const [settings, setSettings] = useState<Settings>(getSettings());
    const [selectedSkin, setSelectedSkin] = useState<Skin>(getSelectedSkin());
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(getLeaderboard());
    
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    useEffect(() => {
        saveSelectedSkin(selectedSkin);
    }, [selectedSkin]);

    useEffect(() => {
        saveLeaderboard(leaderboard);
    }, [leaderboard]);
    
    const handleStartGame = useCallback(() => setGameStatus(GameStatus.Playing), []);
    const handlePauseGame = useCallback(() => setGameStatus(GameStatus.Paused), []);
    const handleResumeGame = useCallback(() => setGameStatus(GameStatus.Playing), []);
    const handleRestart = useCallback(() => setGameStatus(GameStatus.Playing), []);
    const handleGoToMenu = useCallback(() => setGameStatus(GameStatus.MainMenu), []);
    const handleOpenSettings = useCallback(() => setGameStatus(GameStatus.Settings), []);
    const handleOpenLeaderboard = useCallback(() => setGameStatus(GameStatus.Leaderboard), []);
    const handleOpenSkins = useCallback(() => setGameStatus(GameStatus.Skins), []);

    const handleGameOver = useCallback((score: number) => {
        setLastScore(score);
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('highScore', score.toString());
        }
        setGameStatus(GameStatus.GameOver);
    }, [highScore]);
    
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
                    onPause={handlePauseGame} 
                    onGameOver={handleGameOver}
                    settings={settings}
                    skin={selectedSkin}
                />;
            case GameStatus.Paused:
                return <PauseMenu onResume={handleResumeGame} onRestart={handleRestart} onMenu={handleGoToMenu} />;
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
            {renderScreen()}
        </div>
    );
};

export default App;
