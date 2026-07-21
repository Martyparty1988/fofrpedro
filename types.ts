export enum GameStatus {
    MainMenu,
    Playing,
    GameOver,
    Settings,
    Leaderboard,
    Skins,
}

export enum Lane {
    Left = -1,
    Middle = 0,
    Right = 1,
}

export enum GameObjectType {
    Lajna,
    Cevko,
    SpeedBoost,
    Invincibility,
    Policajt,
    Auto,
    Barikada,
    Leseni,
}

export interface GameObject {
    id: number;
    type: GameObjectType;
    position: [number, number, number];
    lane: Lane;
    width: number;
    height: number;
    depth: number;
    hasPassedPlayer: boolean;
}

export interface PowerUpState {
    type: GameObjectType.SpeedBoost | GameObjectType.Invincibility;
    timeLeft: number;
}

export interface PlayerState {
    lane: Lane;
    positionX: number;
    health: number;
    damageCooldown: number;
    isFlipping: boolean;
    flipProgress: number; // 0 to 1
    flipCooldown: number;
    isSliding: boolean;
    slideProgress: number; // 0 to 1
    slideCooldown: number;
}

export interface ComboState {
    count: number;
    multiplier: number;
    timeLeft: number;
    best: number;
}

export interface RunStats {
    distance: number;
    collectibles: number;
    destroyed: number;
    avoided: number;
    nearMisses: number;
}

export interface RunSummary extends RunStats {
    score: number;
    bestCombo: number;
    coinsEarned: number;
}

export interface GameEffect {
    id: number;
    type: 'lajna-collect' | 'cevko-collect' | 'powerup-collect' | 'obstacle-destroy' | 'damage' | 'speech-bubble';
    position: [number, number, number];
    createdAt: number;
    text?: string;
}

export interface GameState {
    status: 'countdown' | 'playing' | 'paused' | 'gameOver';
    countdown: number;
    score: number;
    gameSpeed: number;
    player: PlayerState;
    gameObjects: GameObject[];
    activePowerUps: PowerUpState[];
    effects: GameEffect[];
    combo: ComboState;
    stats: RunStats;
}

export interface Skin {
    id: string;
    name: string;
    colors: {
        hat: string;
        backpack: string;
        body: string;
    }
    description: string;
    unlockCost: number;
}

export interface LeaderboardEntry {
    name: string;
    score: number;
    date: string;
}

export interface Settings {
    musicVolume: number; // 0 to 1
    sfxVolume: number; // 0 to 1
    haptics: boolean;
    cameraShake: boolean;
    reducedMotion: boolean;
    quality: 'auto' | 'high' | 'balanced' | 'low';
}

export interface PlayerProgress {
    coins: number;
    totalRuns: number;
    totalDistance: number;
    unlockedSkinIds: string[];
    dailyChallengeDate: string;
    dailyChallengeClaimed: boolean;
}

export type DailyChallengeMetric = 'score' | 'collectibles' | 'bestCombo' | 'avoided';

export interface DailyChallenge {
    id: string;
    title: string;
    description: string;
    metric: DailyChallengeMetric;
    target: number;
    reward: number;
}
