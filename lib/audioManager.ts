// This is a mock implementation since Tone.js is not available in this environment.
// In a real project, you would import Tone.js and create real synths.

class AudioManager {
    private volume: number = 0.5;
    private context: AudioContext | null = null;
    private musicNodes: {
        bassOsc?: OscillatorNode,
        bassGain?: GainNode,
        arpOsc?: OscillatorNode,
        arpGain?: GainNode,
        kick?: AudioBufferSourceNode,
    } = {};
    private musicInterval: number | null = null;
    private isMusicPlaying: boolean = false;
    
    private initContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    private playSound(freq: number, type: OscillatorType, duration: number) {
        this.initContext();
        if (!this.context || this.volume === 0) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);

            gainNode.gain.setValueAtTime(this.volume * 0.5, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration);

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
            
            oscillator.start(this.context.currentTime);
            oscillator.stop(this.context.currentTime + duration);
        } catch(e) {
            console.error("Audio playback failed", e);
        }
    }
    
    startMusic() {
        if (this.isMusicPlaying) return;
        this.initContext();
        if (!this.context) return;
        this.isMusicPlaying = true;
        
        const musicVolume = this.volume * 0.3;
        const now = this.context.currentTime;
        
        // Arpeggio
        const arpGain = this.context.createGain();
        arpGain.gain.setValueAtTime(musicVolume, now);
        arpGain.connect(this.context.destination);
        const arpOsc = this.context.createOscillator();
        arpOsc.type = 'sawtooth';
        arpOsc.connect(arpGain);
        arpOsc.start(now);
        this.musicNodes.arpGain = arpGain;
        this.musicNodes.arpOsc = arpOsc;

        const arpNotes = [220, 329.63, 440, 523.25]; // A2, E4, A4, C5
        let arpStep = 0;
        
        // Bass
        const bassGain = this.context.createGain();
        bassGain.gain.setValueAtTime(musicVolume * 1.2, now);
        bassGain.connect(this.context.destination);
        const bassOsc = this.context.createOscillator();
        bassOsc.type = 'sine';
        bassOsc.connect(bassGain);
        bassOsc.start(now);
        this.musicNodes.bassGain = bassGain;
        this.musicNodes.bassOsc = bassOsc;
        const bassNotes = [55, 55, 65.41, 48.99]; // A1, A1, C2, G#1
        let bassStep = 0;


        const tick = () => {
            if(!this.context) return;
            const time = this.context.currentTime;
            // Arpeggio pattern
            this.musicNodes.arpOsc?.frequency.setValueAtTime(arpNotes[arpStep % arpNotes.length], time);
            arpStep++;
            // Bass pattern
            if (arpStep % 4 === 1) {
                this.musicNodes.bassOsc?.frequency.setValueAtTime(bassNotes[bassStep % bassNotes.length], time);
                bassStep++;
            }
        };

        this.musicInterval = window.setInterval(tick, 150);
    }
    
    stopMusic() {
        if (!this.isMusicPlaying || !this.context) return;
        this.isMusicPlaying = false;
        
        const now = this.context.currentTime;
        const fadeOutTime = 0.5;
        
        if (this.musicNodes.arpGain) this.musicNodes.arpGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutTime);
        if (this.musicNodes.bassGain) this.musicNodes.bassGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutTime);
        
        if(this.musicNodes.arpOsc) this.musicNodes.arpOsc.stop(now + fadeOutTime);
        if(this.musicNodes.bassOsc) this.musicNodes.bassOsc.stop(now + fadeOutTime);

        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.musicNodes = {};
    }

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.isMusicPlaying && this.context) {
             const musicVolume = this.volume * 0.3;
             const now = this.context.currentTime;
             if(this.musicNodes.arpGain) this.musicNodes.arpGain.gain.linearRampToValueAtTime(musicVolume, now + 0.1);
             if(this.musicNodes.bassGain) this.musicNodes.bassGain.gain.linearRampToValueAtTime(musicVolume * 1.2, now + 0.1);
        }
    }

    playCollectSound() {
        this.playSound(880, 'triangle', 0.1);
    }
    
    playPowerUpSound() {
        this.playSound(1200, 'sine', 0.3);
    }

    playDamageSound() {
        this.playSound(110, 'square', 0.3);
    }

    playDestroySound() {
        this.playSound(150, 'sawtooth', 0.2);
    }

    playFlipSound() {
        this.playSound(600, 'sine', 0.2);
    }

    playSlideSound() {
        this.initContext();
        if (!this.context || this.volume === 0) return;
        
        try {
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            const now = this.context.currentTime;
            const duration = 0.3;

            gainNode.gain.setValueAtTime(this.volume * 0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch(e) {
            console.error("Audio playback failed", e);
        }
    }

    playGameOverSound() {
        this.playSound(200, 'sawtooth', 0.8);
    }
}

export const audioManager = new AudioManager();