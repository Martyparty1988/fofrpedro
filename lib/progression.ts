import { DailyChallenge, RunSummary } from '../types';

const DAILY_CHALLENGES: Omit<DailyChallenge, 'id'>[] = [
    {
        title: 'Pražský sprint',
        description: 'Nahraj v jednom běhu alespoň 12 000 bodů.',
        metric: 'score',
        target: 12000,
        reward: 25,
    },
    {
        title: 'Sběratelská šichta',
        description: 'Seber v jednom běhu 18 bonusů.',
        metric: 'collectibles',
        target: 18,
        reward: 25,
    },
    {
        title: 'Bez zaváhání',
        description: 'Dostaň kombo alespoň na hodnotu 10.',
        metric: 'bestCombo',
        target: 10,
        reward: 30,
    },
    {
        title: 'Kličkař',
        description: 'Bezpečně se vyhni 24 překážkám.',
        metric: 'avoided',
        target: 24,
        reward: 30,
    },
];

export const getLocalDateKey = (date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const hashDate = (dateKey: string): number => {
    let hash = 0;
    for (const character of dateKey) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return hash;
};

export const getDailyChallenge = (date = new Date()): DailyChallenge => {
    const id = getLocalDateKey(date);
    return { id, ...DAILY_CHALLENGES[hashDate(id) % DAILY_CHALLENGES.length] };
};

export const isDailyChallengeComplete = (challenge: DailyChallenge, summary: RunSummary): boolean =>
    summary[challenge.metric] >= challenge.target;

export const calculateRunCoins = (summary: Omit<RunSummary, 'coinsEarned'>): number =>
    Math.max(1, Math.floor(summary.score / 1500))
    + Math.floor(summary.collectibles / 4)
    + summary.nearMisses * 2
    + Math.floor(summary.bestCombo / 5);
