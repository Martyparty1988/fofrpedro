import { describe, expect, it } from 'vitest';
import {
    getGameMessageDurationMs,
    MAX_GAME_MESSAGE_DURATION_MS,
    MIN_GAME_MESSAGE_DURATION_MS,
} from './gamePresentation';

describe('game message presentation', () => {
    it('keeps short messages visible long enough to notice', () => {
        expect(getGameMessageDurationMs('Pedro běží.')).toBe(MIN_GAME_MESSAGE_DURATION_MS);
    });

    it('gives longer messages more reading time', () => {
        const shortDuration = getGameMessageDurationMs('Praha nespí. Pedro taky ne.');
        const longDuration = getGameMessageDurationMs('Tohle je výrazně delší herní hláška, kterou hráč potřebuje v klidu přečíst.');

        expect(longDuration).toBeGreaterThan(shortDuration);
    });

    it('caps the display time so a message never dominates the run', () => {
        const veryLongMessage = Array.from({ length: 80 }, () => 'slovo').join(' ');
        expect(getGameMessageDurationMs(veryLongMessage)).toBe(MAX_GAME_MESSAGE_DURATION_MS);
    });
});
