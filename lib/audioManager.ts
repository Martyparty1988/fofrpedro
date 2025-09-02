
// This is a mock implementation since Tone.js is not available in this environment.
// In a real project, you would import Tone.js and create real synths.

class AudioManager {
    private volume: number = 0.5;
    private context: AudioContext | null = null;

    private playSound(freq: number, type: OscillatorType, duration: number) {
        if (!this.context) {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.volume === 0) return;
        
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

    setVolume(volume: number) {
        this.volume = Math.max(0, Math.min(1, volume));
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

    playGameOverSound() {
        this.playSound(200, 'sawtooth', 0.8);
    }
}

export const audioManager = new AudioManager();
