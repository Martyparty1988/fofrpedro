import type { Skin } from '../types';

export const SKINS: Skin[] = [
    {
        id: 'piko-pete',
        name: 'Piko Pete',
        description: 'Původní pouliční výbava. Lehká, rychlá a bez zbytečných řečí.',
        unlockCost: 0,
        colors: { hat: '#a78bfa', backpack: '#475569', body: '#374151' },
    },
    {
        id: 'piko-punk',
        name: 'Piko Punk',
        description: 'Studené neonové barvy pro noční průlet Prahou.',
        unlockCost: 45,
        colors: { hat: '#7dd3fc', backpack: '#111827', body: '#1f2937' },
    },
    {
        id: 'golden-piko',
        name: 'Golden Piko',
        description: 'Výbava pro hráče, kteří už ulici několikrát přežili.',
        unlockCost: 120,
        colors: { hat: '#22c55e', backpack: '#d1d5db', body: '#ca8a04' },
    },
];
