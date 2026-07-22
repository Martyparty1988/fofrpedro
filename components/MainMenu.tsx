import React from 'react';
import { DailyChallenge, PlayerProgress } from '../types';
import { Button } from './Button';

interface MainMenuProps {
    onStart: () => void;
    onSettings: () => void;
    onLeaderboard: () => void;
    onSkins: () => void;
    highScore: number;
    progress: PlayerProgress;
    dailyChallenge: DailyChallenge;
}

export const MainMenu: React.FC<MainMenuProps> = ({
    onStart,
    onSettings,
    onLeaderboard,
    onSkins,
    highScore,
    progress,
    dailyChallenge,
}) => (
    <main className="main-menu safe-screen screen-enter">
        <div className="main-menu__sky" aria-hidden="true">
            <div className="main-menu__moon" />
            <div className="main-menu__city main-menu__city--back" />
            <div className="main-menu__city main-menu__city--front" />
            <div className="main-menu__road" />
        </div>

        <header className="main-menu__topbar">
            <div className="brand-chip"><span>FP</span><strong>FOFR PEDRO</strong></div>
            <div className="main-menu__currencies">
                <span>REKORD <strong>{highScore.toLocaleString('cs-CZ')}</strong></span>
                <span className="coin-chip">◈ {progress.coins}</span>
            </div>
        </header>

        <section className="main-menu__content">
            <div className="main-menu__hero">
                <span className="main-menu__kicker">NOČNÍ ÚTĚK PRAHOU</span>
                <h1><span>FOFR</span> PEDRO</h1>
                <p>Rychlejší. Drsnější. A tentokrát bez výmluv.</p>
            </div>

            <div className="main-menu__panel">
                <div className="daily-card">
                    <div>
                        <span>DENNÍ VÝZVA · +{dailyChallenge.reward} ◈</span>
                        <strong>{dailyChallenge.title}</strong>
                        <p>{dailyChallenge.description}</p>
                    </div>
                    <b className={progress.dailyChallengeClaimed ? 'is-complete' : ''}>
                        {progress.dailyChallengeClaimed ? 'SPLNĚNO' : 'AKTIVNÍ'}
                    </b>
                </div>

                <Button onClick={onStart} className="play-button">
                    <span>▶</span> HRÁT
                </Button>

                <div className="main-menu__secondary-actions">
                    <button type="button" onClick={onSkins}><span>◈</span>Vzhledy</button>
                    <button type="button" onClick={onLeaderboard}><span>⌁</span>Žebříček</button>
                    <button type="button" onClick={onSettings}><span>⚙</span>Nastavení</button>
                </div>

                <div className="control-strip" aria-label="Ovládání hry">
                    <span><b>← →</b> PRUHY</span>
                    <span><b>↑</b> SALTO</span>
                    <span><b>↓</b> SKLUZ</span>
                </div>
            </div>
        </section>

        <footer className="main-menu__footer">
            <span>{progress.totalRuns} běhů · {Math.floor(progress.totalDistance / 1000)} km</span>
            <span>Drsný humor · 18+</span>
        </footer>
    </main>
);
