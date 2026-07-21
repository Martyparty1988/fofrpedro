export type RunnerMotion = 'idle' | 'run' | 'jump' | 'flip' | 'slide' | 'hit' | 'death';

export interface RunnerPose {
    stride: number;
    leftKnee: number;
    rightKnee: number;
    armSwing: number;
    elbowFlex: number;
    torsoLean: number;
    torsoTwist: number;
    bob: number;
}

/**
 * Produces a compact, deterministic running pose for a humanoid skeleton.
 * Values are additive radians except for `bob`, which is expressed in metres
 * before the model is normalized to the game's three-unit character height.
 */
export const createRunnerPose = (
    elapsedTime: number,
    motion: RunnerMotion,
    reducedMotion = false,
): RunnerPose => {
    const running = motion === 'run';
    const sliding = motion === 'slide';
    const hit = motion === 'hit' || motion === 'death';
    const airborne = motion === 'jump' || motion === 'flip';
    const phase = elapsedTime * (running ? 9.4 : 1.45);
    const motionScale = running ? (reducedMotion ? 0.3 : 1) : airborne ? 0.42 : sliding ? 0.18 : hit ? 0.12 : 0.08;
    const wave = Math.sin(phase);
    const stride = wave * 0.72 * motionScale;
    const doubleStep = Math.sin(phase * 2);

    return {
        stride,
        leftKnee: Math.max(0, -wave) * 0.92 * motionScale,
        rightKnee: Math.max(0, wave) * 0.92 * motionScale,
        armSwing: stride * 0.78,
        elbowFlex: (running ? 0.58 : 0.12) * motionScale,
        torsoLean: sliding ? 0.72 : hit ? -0.3 : running ? 0.13 * motionScale : 0.015 * Math.sin(phase),
        torsoTwist: doubleStep * 0.045 * motionScale,
        bob: sliding
            ? -0.34
            : hit
                ? -0.08
                : running
                    ? Math.abs(doubleStep) * 0.035 * motionScale
                    : Math.sin(phase) * 0.008,
    };
};
