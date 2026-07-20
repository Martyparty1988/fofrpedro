export const CITY_SPAN = 240;

export type CitySide = -1 | 1;

export interface CityWindow {
    buildingIndex: number;
    y: number;
    zOffset: number;
    color: string;
}

export interface CityBuilding {
    x: number;
    z: number;
    width: number;
    height: number;
    depth: number;
    bodyColor: string;
    accentColor: string;
}

export interface CityLayout {
    buildings: CityBuilding[];
    windows: CityWindow[];
}

const BODY_COLORS = ['#111827', '#172033', '#20283a', '#121b2b', '#252431'];
const ACCENT_COLORS = ['#456174', '#59445f', '#3b5661', '#665b4a'];
const WINDOW_COLORS = ['#70e1f5', '#ff7bd5', '#ffd28a', '#8ba7ff'];

const createRandom = (seed: number) => {
    let value = seed >>> 0;

    return () => {
        value += 0x6d2b79f5;
        let result = value;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
    };
};

export const createCityLayout = (side: CitySide, seed: number, count = 20): CityLayout => {
    const random = createRandom(seed);
    const buildings: CityBuilding[] = [];
    const windows: CityWindow[] = [];

    for (let index = 0; index < count; index++) {
        const width = 5 + random() * 4;
        const depth = 7 + random() * 7;
        const height = 14 + random() * 26;
        const building: CityBuilding = {
            x: side * (10.5 + width / 2 + random() * 5),
            z: -CITY_SPAN / 2 + ((index + 0.5) * CITY_SPAN) / count + (random() - 0.5) * 5,
            width,
            height,
            depth,
            bodyColor: BODY_COLORS[Math.floor(random() * BODY_COLORS.length)],
            accentColor: ACCENT_COLORS[Math.floor(random() * ACCENT_COLORS.length)],
        };
        buildings.push(building);

        const floors = Math.min(11, Math.max(4, Math.floor(height / 3.2)));
        const columns = Math.min(4, Math.max(2, Math.floor(depth / 2.7)));

        for (let floor = 0; floor < floors; floor++) {
            const y = 2.3 + floor * ((height - 4) / Math.max(1, floors - 1));
            if (y > height - 1.2) continue;

            for (let column = 0; column < columns; column++) {
                if (random() < 0.28) continue;
                const zOffset = columns === 1
                    ? 0
                    : -depth * 0.34 + (column * depth * 0.68) / (columns - 1);
                windows.push({
                    buildingIndex: index,
                    y,
                    zOffset,
                    color: WINDOW_COLORS[Math.floor(random() * WINDOW_COLORS.length)],
                });
            }
        }
    }

    return { buildings, windows };
};
