import { describe, expect, it } from 'vitest';
import { createRunnerPose } from './runnerPose';

describe('createRunnerPose', () => {
    it('keeps the opposing leg and arm gait balanced', () => {
        const pose = createRunnerPose(0.18, 'run');

        expect(pose.stride).not.toBe(0);
        expect(pose.armSwing).toBeCloseTo(pose.stride * 0.78);
        expect(pose.leftKnee).toBeGreaterThanOrEqual(0);
        expect(pose.rightKnee).toBeGreaterThanOrEqual(0);
    });

    it('substantially limits the gait with reduced motion enabled', () => {
        const full = createRunnerPose(0.18, 'run');
        const reduced = createRunnerPose(0.18, 'run', true);

        expect(Math.abs(reduced.stride)).toBeLessThan(Math.abs(full.stride) * 0.4);
        expect(reduced.bob).toBeLessThan(full.bob * 0.4);
    });

    it('uses only subtle breathing movement while idle', () => {
        const idle = createRunnerPose(0.75, 'idle');

        expect(Math.abs(idle.stride)).toBeLessThan(0.06);
        expect(Math.abs(idle.bob)).toBeLessThanOrEqual(0.008);
    });
});
