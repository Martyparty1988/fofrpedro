import { Settings, Skin, LeaderboardEntry } from '../types';
import { SKINS } from '../constants/assets';

const SETTINGS_KEY = 'pedro-run-settings';
const SKIN_KEY = 'pedro-run-skin';
const LEADERBOARD_KEY = 'pedro-run-leaderboard';
const HIGHSCORE_KEY = 'highScore'; // Keep for backward compatibility

const DEFAULT_SETTINGS: Settings = {
    volume: 0.5,
    haptics: true,
    cameraShake: true,
    reducedMotion: false,
};

export const getSettings = (): Settings => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = (settings: Settings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSelectedSkin = (): Skin => {
    const storedId = localStorage.getItem(SKIN_KEY);
    return SKINS.find(s => s.id === storedId) || SKINS[0];
};

export const saveSelectedSkin = (skin: Skin) => {
    localStorage.setItem(SKIN_KEY, skin.id);
};

export const getLeaderboard = (): LeaderboardEntry[] => {
    try {
        const stored = localStorage.getItem(LEADERBOARD_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const saveLeaderboard = (leaderboard: LeaderboardEntry[]) => {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
};

export const exportData = () => {
    const data = {
        [SETTINGS_KEY]: localStorage.getItem(SETTINGS_KEY),
        [SKIN_KEY]: localStorage.getItem(SKIN_KEY),
        [LEADERBOARD_KEY]: localStorage.getItem(LEADERBOARD_KEY),
        [HIGHSCORE_KEY]: localStorage.getItem(HIGHSCORE_KEY),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pedro-run-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importData = (file: File, onImported: () => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target?.result as string;
            const data = JSON.parse(json);
            
            Object.keys(data).forEach(key => {
                if (data[key] !== null) {
                    localStorage.setItem(key, data[key]);
                }
            });
            onImported();
        } catch (error) {
            console.error("Failed to import data:", error);
            alert("Invalid or corrupted backup file.");
        }
    };
    reader.readAsText(file);
};