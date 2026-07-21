type AudioWindow = Window & {
    webkitAudioContext?: typeof AudioContext;
};

class AudioManager {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private musicBus: GainNode | null = null;
    private sfxBus: GainNode | null = null;
    private compressor: DynamicsCompressorNode | null = null;
    private musicVolume = 0.45;
    private sfxVolume = 0.65;
    private musicTimer: number | null = null;
    private ambientSource: AudioBufferSourceNode | null = null;
    private nextStepTime = 0;
    private musicStep = 0;
    private isMusicPlaying = false;

    private initContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.context) {
            const Constructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
            if (!Constructor) return null;
            this.context = new Constructor();
            this.master = this.context.createGain();
            this.musicBus = this.context.createGain();
            this.sfxBus = this.context.createGain();
            this.compressor = this.context.createDynamicsCompressor();
            this.compressor.threshold.value = -18;
            this.compressor.knee.value = 12;
            this.compressor.ratio.value = 5;
            this.compressor.attack.value = 0.004;
            this.compressor.release.value = 0.22;
            this.musicBus.connect(this.compressor);
            this.sfxBus.connect(this.compressor);
            this.compressor.connect(this.master);
            this.master.connect(this.context.destination);
            this.master.gain.value = 0.9;
            this.musicBus.gain.value = this.musicVolume;
            this.sfxBus.gain.value = this.sfxVolume;
        }
        if (this.context.state === 'suspended') void this.context.resume().catch(() => undefined);
        return this.context;
    }

    private createNoiseBuffer(duration = 1): AudioBuffer | null {
        const context = this.initContext();
        if (!context) return null;
        const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const samples = buffer.getChannelData(0);
        let previous = 0;
        for (let index = 0; index < samples.length; index++) {
            const white = Math.random() * 2 - 1;
            previous = previous * 0.86 + white * 0.14;
            samples[index] = previous;
        }
        return buffer;
    }

    private tone(
        frequency: number,
        duration: number,
        options: { type?: OscillatorType; gain?: number; when?: number; destination?: AudioNode; endFrequency?: number } = {},
    ): void {
        const context = this.initContext();
        const destination = options.destination ?? this.sfxBus;
        if (!context || !destination) return;
        const when = Math.max(context.currentTime, options.when ?? context.currentTime);
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = options.type ?? 'sine';
        oscillator.frequency.setValueAtTime(Math.max(20, frequency), when);
        if (options.endFrequency) {
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFrequency), when + duration);
        }
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain ?? 0.22), when + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start(when);
        oscillator.stop(when + duration + 0.03);
    }

    private noise(duration: number, gainValue: number, highpass = 120, when?: number): void {
        const context = this.initContext();
        if (!context || !this.sfxBus) return;
        const buffer = this.createNoiseBuffer(duration);
        if (!buffer) return;
        const start = Math.max(context.currentTime, when ?? context.currentTime);
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = highpass;
        gain.gain.setValueAtTime(Math.max(0.0002, gainValue), start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxBus);
        source.start(start);
        source.stop(start + duration);
    }

    private scheduleMusic = (): void => {
        const context = this.context;
        if (!context || !this.musicBus || !this.isMusicPlaying) return;
        const stepLength = 0.15;
        const notes = [110, 164.81, 220, 261.63, 220, 329.63, 261.63, 196];
        while (this.nextStepTime < context.currentTime + 0.42) {
            const step = this.musicStep % notes.length;
            this.tone(notes[step], 0.12, {
                type: step % 2 === 0 ? 'triangle' : 'sawtooth',
                gain: step % 4 === 0 ? 0.07 : 0.035,
                when: this.nextStepTime,
                destination: this.musicBus,
            });
            if (this.musicStep % 4 === 0) {
                this.tone(55, 0.24, { type: 'sine', gain: 0.12, when: this.nextStepTime, endFrequency: 38, destination: this.musicBus });
            }
            this.musicStep++;
            this.nextStepTime += stepLength;
        }
    };

    private startAmbient(): void {
        const context = this.context;
        if (!context || !this.musicBus || this.ambientSource) return;
        const buffer = this.createNoiseBuffer(2);
        if (!buffer) return;
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = true;
        filter.type = 'lowpass';
        filter.frequency.value = 950;
        gain.gain.value = 0.025;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicBus);
        source.start();
        this.ambientSource = source;
    }

    startMusic(): void {
        if (this.isMusicPlaying) return;
        const context = this.initContext();
        if (!context || !this.musicBus) return;
        this.isMusicPlaying = true;
        this.musicBus.gain.cancelScheduledValues(context.currentTime);
        this.musicBus.gain.setTargetAtTime(this.musicVolume, context.currentTime, 0.08);
        this.nextStepTime = context.currentTime + 0.04;
        this.musicStep = 0;
        this.startAmbient();
        this.scheduleMusic();
        this.musicTimer = window.setInterval(this.scheduleMusic, 100);
    }

    stopMusic(): void {
        if (!this.isMusicPlaying) return;
        this.isMusicPlaying = false;
        if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
        this.musicTimer = null;
        if (this.context && this.musicBus) {
            this.musicBus.gain.cancelScheduledValues(this.context.currentTime);
            this.musicBus.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.12);
        }
        this.ambientSource?.stop(this.context ? this.context.currentTime + 0.35 : 0);
        this.ambientSource = null;
    }

    duckMusic(): void {
        if (!this.context || !this.musicBus) return;
        this.musicBus.gain.cancelScheduledValues(this.context.currentTime);
        this.musicBus.gain.setTargetAtTime(this.musicVolume * 0.18, this.context.currentTime, 0.05);
    }

    setMusicVolume(value: number): void {
        this.musicVolume = Math.max(0, Math.min(1, value));
        if (this.context && this.musicBus && this.isMusicPlaying) {
            this.musicBus.gain.setTargetAtTime(this.musicVolume, this.context.currentTime, 0.05);
        }
    }

    setSfxVolume(value: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, value));
        if (this.context && this.sfxBus) this.sfxBus.gain.setTargetAtTime(this.sfxVolume, this.context.currentTime, 0.04);
    }

    playCollectSound(): void {
        const now = this.initContext()?.currentTime ?? 0;
        this.tone(740, 0.12, { type: 'triangle', gain: 0.18, when: now });
        this.tone(1110, 0.16, { type: 'sine', gain: 0.12, when: now + 0.055 });
    }

    playPowerUpSound(): void {
        const now = this.initContext()?.currentTime ?? 0;
        [330, 440, 660, 880].forEach((frequency, index) => this.tone(frequency, 0.24, { type: 'sine', gain: 0.13, when: now + index * 0.055 }));
    }

    playDamageSound(): void {
        const now = this.initContext()?.currentTime ?? 0;
        this.noise(0.24, 0.34, 70, now);
        this.tone(115, 0.32, { type: 'sawtooth', gain: 0.22, when: now, endFrequency: 46 });
    }

    playDestroySound(): void {
        const now = this.initContext()?.currentTime ?? 0;
        this.noise(0.2, 0.24, 180, now);
        this.tone(190, 0.2, { type: 'square', gain: 0.12, when: now, endFrequency: 70 });
    }

    playFlipSound(): void {
        this.tone(420, 0.34, { type: 'sine', gain: 0.13, endFrequency: 980 });
    }

    playSlideSound(): void {
        this.noise(0.34, 0.18, 650);
        this.tone(330, 0.3, { type: 'triangle', gain: 0.08, endFrequency: 95 });
    }

    playNearMissSound(): void {
        this.tone(980, 0.1, { type: 'triangle', gain: 0.08, endFrequency: 620 });
    }

    playCountdownSound(final = false): void {
        this.tone(final ? 880 : 520, final ? 0.22 : 0.12, { type: 'sine', gain: final ? 0.2 : 0.12 });
    }

    playGameOverSound(): void {
        const now = this.initContext()?.currentTime ?? 0;
        [220, 164.81, 110].forEach((frequency, index) => this.tone(frequency, 0.55, { type: 'sawtooth', gain: 0.12, when: now + index * 0.16, endFrequency: frequency * 0.72 }));
        this.noise(0.55, 0.2, 80, now);
    }
}

export const audioManager = new AudioManager();
