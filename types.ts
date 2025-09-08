export enum GameStatus {
    MainMenu,
    Playing,
    Paused,
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
}

export interface GameObject {
    id: number;
    type: GameObjectType;
    position: [number, number, number];
    lane: Lane;
    width: number;
    height: number;
    depth: number;
}

export interface PowerUpState {
    type: GameObjectType.SpeedBoost | GameObjectType.Invincibility;
    timeLeft: number;
}

export interface PlayerState {
    lane: Lane;
    health: number;
    isFlipping: boolean;
    flipProgress: number; // 0 to 1
    flipCooldown: number;
    isSliding: boolean;
    slideProgress: number; // 0 to 1
    slideCooldown: number;
}

export interface GameEffect {
    id: number;
    type: 'lajna-collect' | 'cevko-collect' | 'powerup-collect' | 'damage';
    position: [number, number, number];
    createdAt: number;
}

export interface GameState {
    status: 'playing' | 'paused' | 'gameOver';
    score: number;
    gameSpeed: number;
    player: PlayerState;
    gameObjects: GameObject[];
    activePowerUps: PowerUpState[];
    effects: GameEffect[];
}

export interface Skin {
    id: string;
    name: string;
    colors: {
        hat: string;
        backpack: string;
        body: string;
    }
}

export interface LeaderboardEntry {
    name: string;
    score: number;
    date: string;
}

export interface Settings {
    volume: number; // 0 to 1
    haptics: boolean;
    cameraShake: boolean;
    reducedMotion: boolean;
}