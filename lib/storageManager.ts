import { Settings, Skin, LeaderboardEntry } from '../types';
import { SKINS } from '../constants/skins';

const SETTINGS_KEY = 'pedro-run-settings';
const SKIN_KEY = 'pedro-run-skin';
const LEADERBOARD_KEY = 'pedro-run-leaderboard';
const HIGHSCORE_KEY = 'highScore';
const MAX_BACKUP_SIZE = 1_000_000;

const ALLOWED_BACKUP_KEYS = [SETTINGS_KEY, SKIN_KEY, LEADERBOARD_KEY, HIGHSCORE_KEY] as const;

const DEFAULT_SETTINGS: Settings = {
    volume: 0.5,
    haptics: true,
    cameraShake: true,
    reducedMotion: false,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const safeGetItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const safeSetItem = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.error(`Unable to save ${key}:`, error);
    }
};

const normalizeSettings = (value: unknown): Settings => {
    if (!isRecord(value)) return DEFAULT_SETTINGS;

    return {
        volume: typeof value.volume === 'number' && Number.isFinite(value.volume)
            ? Math.max(0, Math.min(1, value.volume))
            : DEFAULT_SETTINGS.volume,
        haptics: typeof value.haptics === 'boolean' ? value.haptics : DEFAULT_SETTINGS.haptics,
        cameraShake: typeof value.cameraShake === 'boolean' ? value.cameraShake : DEFAULT_SETTINGS.cameraShake,
        reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    };
};

const normalizeLeaderboard = (value: unknown): LeaderboardEntry[] => {
    if (!Array.isArray(value)) return [];

    return value
        .filter((entry): entry is Record<string, unknown> => isRecord(entry))
        .filter(entry => (
            typeof entry.name === 'string' &&
            entry.name.trim().length > 0 &&
            typeof entry.score === 'number' &&
            Number.isFinite(entry.score) &&
            entry.score >= 0 &&
            typeof entry.date === 'string' &&
            !Number.isNaN(Date.parse(entry.date))
        ))
        .map(entry => ({
            name: String(entry.name).trim().slice(0, 10),
            score: Math.floor(Number(entry.score)),
            date: String(entry.date),
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 5);
};

export const getSettings = (): Settings => {
    try {
        const stored = safeGetItem(SETTINGS_KEY);
        return stored ? normalizeSettings(JSON.parse(stored)) : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

export const saveSettings = (settings: Settings): void => {
    safeSetItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
};

export const getSelectedSkin = (): Skin => {
    const storedId = safeGetItem(SKIN_KEY);
    return SKINS.find(skin => skin.id === storedId) ?? SKINS[0];
};

export const saveSelectedSkin = (skin: Skin): void => {
    safeSetItem(SKIN_KEY, skin.id);
};

export const getLeaderboard = (): LeaderboardEntry[] => {
    try {
        const stored = safeGetItem(LEADERBOARD_KEY);
        return stored ? normalizeLeaderboard(JSON.parse(stored)) : [];
    } catch {
        return [];
    }
};

export const saveLeaderboard = (leaderboard: LeaderboardEntry[]): void => {
    safeSetItem(LEADERBOARD_KEY, JSON.stringify(normalizeLeaderboard(leaderboard)));
};

export const getHighScore = (): number => {
    const parsed = Number.parseInt(safeGetItem(HIGHSCORE_KEY) ?? '0', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export const saveHighScore = (score: number): void => {
    safeSetItem(HIGHSCORE_KEY, String(Math.max(0, Math.floor(score))));
};

export const exportData = (): void => {
    const data = {
        version: 1,
        [SETTINGS_KEY]: safeGetItem(SETTINGS_KEY),
        [SKIN_KEY]: safeGetItem(SKIN_KEY),
        [LEADERBOARD_KEY]: safeGetItem(LEADERBOARD_KEY),
        [HIGHSCORE_KEY]: safeGetItem(HIGHSCORE_KEY),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pedro-run-backup.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};

const validateBackupValue = (key: typeof ALLOWED_BACKUP_KEYS[number], rawValue: string): string => {
    switch (key) {
        case SETTINGS_KEY:
            return JSON.stringify(normalizeSettings(JSON.parse(rawValue)));
        case SKIN_KEY:
            if (!SKINS.some(skin => skin.id === rawValue)) throw new Error('Unknown skin');
            return rawValue;
        case LEADERBOARD_KEY:
            return JSON.stringify(normalizeLeaderboard(JSON.parse(rawValue)));
        case HIGHSCORE_KEY: {
            const score = Number.parseInt(rawValue, 10);
            if (!Number.isFinite(score) || score < 0) throw new Error('Invalid high score');
            return String(Math.floor(score));
        }
    }
};

export const importData = (file: File, onImported: () => void): void => {
    if (file.size > MAX_BACKUP_SIZE) {
        alert('Soubor se zálohou je příliš velký.');
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        try {
            const parsed: unknown = JSON.parse(String(event.target?.result ?? ''));
            if (!isRecord(parsed)) throw new Error('Backup must be an object');

            const valuesToStore: Array<[string, string]> = [];
            for (const key of ALLOWED_BACKUP_KEYS) {
                const value = parsed[key];
                if (value === null || value === undefined) continue;
                if (typeof value !== 'string') throw new Error(`Invalid value for ${key}`);
                valuesToStore.push([key, validateBackupValue(key, value)]);
            }

            if (valuesToStore.length === 0) throw new Error('Backup contains no supported data');
            valuesToStore.forEach(([key, value]) => localStorage.setItem(key, value));
            onImported();
        } catch (error) {
            console.error('Failed to import data:', error);
            alert('Soubor se zálohou je neplatný nebo poškozený.');
        }
    };
    reader.onerror = () => alert('Soubor se zálohou se nepodařilo přečíst.');
    reader.readAsText(file);
};
