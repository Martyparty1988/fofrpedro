import React, { useState } from 'react';
import { Button } from './Button';
import { getRandomQuote } from '../constants/content';
import { DailyChallenge, LeaderboardEntry, RunSummary } from '../types';

interface GameOverScreenProps {
    summary: RunSummary;
    highScore: number;
    onRestart: () => void;
    onMenu: () => void;
    addLeaderboardEntry: (name: string) => void;
    leaderboard: LeaderboardEntry[];
    dailyChallenge: DailyChallenge;
    dailyCompleted: boolean;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
    summary,
    highScore,
    onRestart,
    onMenu,
    addLeaderboardEntry,
    leaderboard,
    dailyChallenge,
    dailyCompleted,
}) => {
    const [name, setName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [shared, setShared] = useState(false);
    const [quote] = useState(getRandomQuote);
    const isHighScore = summary.score > 0 && (leaderboard.length < 5 || summary.score > leaderboard[leaderboard.length - 1].score);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) return;
        addLeaderboardEntry(name.trim());
        setSubmitted(true);
    };

    const handleShare = async () => {
        const text = `Fofr Pedro: ${summary.score.toLocaleString('cs-CZ')} bodů, kombo ${summary.bestCombo} a ${Math.floor(summary.distance)} metrů. Překonáš mě?`;
        try {
            if (navigator.share) await navigator.share({ title: 'Fofr Pedro', text, url: window.location.origin });
            else await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
            setShared(true);
        } catch {
            // Cancelling a native share sheet should not interrupt the results screen.
        }
    };

    return (
        <div className="results-screen safe-screen screen-enter">
            <div className="results-screen__header">
                <span>BĚH UKONČEN</span>
                <h2>{summary.score.toLocaleString('cs-CZ')}</h2>
                <p>REKORD {highScore.toLocaleString('cs-CZ')}</p>
            </div>

            <blockquote>„{quote}“</blockquote>

            <div className="results-grid">
                <div><span>VZDÁLENOST</span><strong>{Math.floor(summary.distance)} m</strong></div>
                <div><span>NEJLEPŠÍ KOMBO</span><strong>{summary.bestCombo}</strong></div>
                <div><span>PŘEKÁŽKY</span><strong>{summary.avoided + summary.destroyed}</strong></div>
                <div><span>TĚSNÉ ÚHYBY</span><strong>{summary.nearMisses}</strong></div>
            </div>

            <div className={`daily-result ${dailyCompleted ? 'is-complete' : ''}`}>
                <span>{dailyCompleted ? 'DENNÍ VÝZVA SPLNĚNA' : dailyChallenge.title}</span>
                <strong>+{summary.coinsEarned} ◈</strong>
                <small>{dailyCompleted ? `Bonus za výzvu je započítaný.` : dailyChallenge.description}</small>
            </div>

            {isHighScore && !submitted && (
                <form onSubmit={handleSubmit} className="result-name-form">
                    <label htmlFor="leaderboard-name">Nový zápis do žebříčku</label>
                    <div>
                        <input
                            id="leaderboard-name"
                            type="text"
                            value={name}
                            onChange={event => setName(event.target.value)}
                            maxLength={10}
                            placeholder="PEDRO"
                            autoComplete="nickname"
                        />
                        <button type="submit">ULOŽIT</button>
                    </div>
                </form>
            )}

            <div className="results-screen__actions">
                <Button onClick={onRestart}>Hrát znovu</Button>
                <Button onClick={handleShare} variant="secondary">{shared ? 'Odkaz zkopírován' : 'Sdílet výsledek'}</Button>
                <Button onClick={onMenu} variant="secondary">Hlavní menu</Button>
            </div>
        </div>
    );
};
