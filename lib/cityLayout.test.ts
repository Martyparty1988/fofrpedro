import { describe, expect, it } from 'vitest';
import { CITY_SPAN, createCityLayout } from './cityLayout';

describe('createCityLayout', () => {
    it('creates a stable layout from the same seed', () => {
        expect(createCityLayout(-1, 42)).toEqual(createCityLayout(-1, 42));
        expect(createCityLayout(-1, 42)).not.toEqual(createCityLayout(-1, 43));
    });

    it('keeps buildings outside the playable road', () => {
        for (const side of [-1, 1] as const) {
            const layout = createCityLayout(side, 100 + side);
            expect(layout.buildings).toHaveLength(20);

            layout.buildings.forEach(building => {
                expect(building.x * side).toBeGreaterThan(10);
                expect(building.z).toBeGreaterThanOrEqual(-CITY_SPAN / 2 - 3);
                expect(building.z).toBeLessThanOrEqual(CITY_SPAN / 2 + 3);
            });
        }
    });

    it('places every window on a valid building facade', () => {
        const layout = createCityLayout(1, 77);

        layout.windows.forEach(window => {
            const building = layout.buildings[window.buildingIndex];
            expect(building).toBeDefined();
            expect(window.y).toBeGreaterThan(0);
            expect(window.y).toBeLessThan(building.height);
            expect(Math.abs(window.zOffset)).toBeLessThanOrEqual(building.depth / 2);
        });
    });
});
