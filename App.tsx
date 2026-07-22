import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { DailyChallenge, GameStatus, LeaderboardEntry, PlayerProgress, RunSummary, Settings, Skin } from './types';
import { MainMenu } from './components/MainMenu';
import { GameOverScreen } from './components/GameOverScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import {
    getHighScore,
    getLeaderboard,
    getProgress,
    getSelectedSkin,
    getSettings,
    saveHighScore,
    saveLeaderboard,
    saveProgress,
    saveSelectedSkin,
    saveSettings,
} from './lib/storageManager';
import { SKINS } from './constants/skins';
import { audioManager } from './lib/audioManager';
import { getDailyChallenge, isDailyChallengeComplete } from './lib/progression';

const GameScreen = lazy(() => import('./components/GameScreen').then(module => ({ default: module.GameScreen })));
const SkinsScreen = lazy(() => import('./components/SkinsScreen').then(module => ({ default: module.SkinsScreen })));

interface LastRun {
    summary: RunSummary;
    dailyChallenge: DailyChallenge;
    dailyCompleted: boolean;
}

const App: React.FC = () => {
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.MainMenu);
    const [lastRun, setLastRun] = useState<LastRun | null>(null);
    const [highScore, setHighScore] = useState(getHighScore);
    const [settings, setSettings] = useState<Settings>(getSettings);
    const [selectedSkin, setSelectedSkin] = useState<Skin>(getSelectedSkin);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(getLeaderboard);
    const [progress, setProgress] = useState<PlayerProgress>(getProgress);
    const [dailyChallenge] = useState(getDailyChallenge);

    useEffect(() => saveSettings(settings), [settings]);
    useEffect(() => saveSelectedSkin(selectedSkin), [selectedSkin]);
    useEffect(() => saveLeaderboard(leaderboard), [leaderboard]);
    useEffect(() => saveHighScore(highScore), [highScore]);
    useEffect(() => saveProgress(progress), [progress]);

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

    const handleGameOver = useCallback((summary: RunSummary) => {
        const dailyCompleted = !progress.dailyChallengeClaimed && isDailyChallengeComplete(dailyChallenge, summary);
        const dailyBonus = dailyCompleted ? dailyChallenge.reward : 0;
        const rewardedSummary = { ...summary, coinsEarned: summary.coinsEarned + dailyBonus };
        setLastRun({ summary: rewardedSummary, dailyChallenge, dailyCompleted });
        setHighScore(current => Math.max(current, summary.score));
        setProgress(current => ({
            ...current,
            coins: current.coins + rewardedSummary.coinsEarned,
            totalRuns: current.totalRuns + 1,
            totalDistance: current.totalDistance + summary.distance,
            dailyChallengeDate: dailyChallenge.id,
            dailyChallengeClaimed: current.dailyChallengeClaimed || dailyCompleted,
        }));
        setGameStatus(GameStatus.GameOver);
        audioManager.stopMusic();
    }, [dailyChallenge, progress.dailyChallengeClaimed]);

    const addLeaderboardEntry = useCallback((name: string) => {
        if (!lastRun) return;
        const newEntry: LeaderboardEntry = { name, score: lastRun.summary.score, date: new Date().toISOString() };
        setLeaderboard(current => [...current, newEntry].sort((a, b) => b.score - a.score).slice(0, 5));
    }, [lastRun]);

    const handleSkinAction = useCallback((skin: Skin) => {
        if (progress.unlockedSkinIds.includes(skin.id)) {
            setSelectedSkin(skin);
            return;
        }
        if (progress.coins < skin.unlockCost) return;
        setProgress(current => ({
            ...current,
            coins: current.coins - skin.unlockCost,
            unlockedSkinIds: [...current.unlockedSkinIds, skin.id],
        }));
        setSelectedSkin(skin);
    }, [progress.coins, progress.unlockedSkinIds]);

    const renderScreen = () => {
        switch (gameStatus) {
            case GameStatus.MainMenu:
                return (
                    <MainMenu
                        onStart={handleStartGame}
                        onSettings={() => setGameStatus(GameStatus.Settings)}
                        onLeaderboard={() => setGameStatus(GameStatus.Leaderboard)}
                        onSkins={() => setGameStatus(GameStatus.Skins)}
                        highScore={highScore}
                        progress={progress}
                        dailyChallenge={dailyChallenge}
                    />
                );
            case GameStatus.Playing:
                return <GameScreen onGameOver={handleGameOver} onMenu={handleGoToMenu} settings={settings} skin={selectedSkin} />;
            case GameStatus.GameOver:
                return lastRun ? (
                    <GameOverScreen
                        summary={lastRun.summary}
                        highScore={highScore}
                        onRestart={handleRestart}
                        onMenu={handleGoToMenu}
                        addLeaderboardEntry={addLeaderboardEntry}
                        leaderboard={leaderboard}
                        dailyChallenge={lastRun.dailyChallenge}
                        dailyCompleted={lastRun.dailyCompleted}
                    />
                ) : null;
            case GameStatus.Settings:
                return <SettingsScreen settings={settings} setSettings={setSettings} onBack={handleGoToMenu} />;
            case GameStatus.Leaderboard:
                return <LeaderboardScreen scores={leaderboard} onBack={handleGoToMenu} />;
            case GameStatus.Skins:
                return (
                    <SkinsScreen
                        skins={SKINS}
                        selectedSkin={selectedSkin}
                        progress={progress}
                        onSkinAction={handleSkinAction}
                        onBack={handleGoToMenu}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-full w-full bg-black">
            <Suspense fallback={(
                <div className="loading-screen">
                    <span className="loading-screen__mark">FP</span>
                    <strong>FOFR PEDRO</strong>
                    <i />
                    <small>Načítám noční Prahu…</small>
                </div>
            )}>
                {renderScreen()}
            </Suspense>
        </div>
    );
};

export default App;
