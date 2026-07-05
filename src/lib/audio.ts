// Audio Synthesizer using Web Audio API for ProTrack Notifications
// Provides different, distinct sound options for 'Disetujui' and 'Perlu Revisi'

export type SoundProfileId = 'standard' | 'digital_bell' | 'fanfare' | 'dissonant' | 'buzz' | 'descend';

export interface SoundProfile {
  id: SoundProfileId;
  name: string;
  description: string;
  category: 'Disetujui' | 'Perlu Revisi';
}

export const APPROVED_SOUND_PROFILES: SoundProfile[] = [
  {
    id: 'standard',
    name: 'Melodi Mayor (Ascending Standard)',
    description: 'Rangkaian nada mayor menanjak (C4 -> E4 -> G4 -> C5) yang harmonis dan positif.',
    category: 'Disetujui'
  },
  {
    id: 'digital_bell',
    name: 'Lonceng Digital (Upbeat High)',
    description: 'Dua ketukan lonceng bernada tinggi dan modern (E5 -> A5) untuk konfirmasi instan.',
    category: 'Disetujui'
  },
  {
    id: 'fanfare',
    name: 'Sukses Fanfare (Triumphant)',
    description: 'Arpeggio riang gembira beruntun cepat (G4 -> C5 -> E5 -> G5) penanda target tercapai.',
    category: 'Disetujui'
  }
];

export const REVISION_SOUND_PROFILES: SoundProfile[] = [
  {
    id: 'dissonant',
    name: 'Nada Peringatan Disonan (Standard Warning)',
    description: 'Dua nada agak ditalaseling secara disonan (F#4 -> C4) untuk menarik perhatian tanpa bising.',
    category: 'Perlu Revisi'
  },
  {
    id: 'buzz',
    name: 'Denyut Alarm (Soft Caution)',
    description: 'Dua denyut synth bass lembut berfrekuensi rendah sebagai sinyal korektif.',
    category: 'Perlu Revisi'
  },
  {
    id: 'descend',
    name: 'Melodi Menurun (Descend Minor)',
    description: 'Rangkaian tiga nada minor menurun (A4 -> F4 -> D4) penanda perlunya perbaikan.',
    category: 'Perlu Revisi'
  }
];

// Helper to get browser AudioContext safely
const getAudioContext = (): AudioContext | null => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

// Play a specific sound profile
export const playNotificationSound = (profileId: SoundProfileId) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser security autoplays policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  switch (profileId) {
    // === APPROVED / SUCCESS SOUNDS ===
    case 'standard': {
      // C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
      break;
    }

    case 'digital_bell': {
      // E5 (659.25), A5 (880.00)
      const notes = [659.25, 880.00];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
      });
      break;
    }

    case 'fanfare': {
      // G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99)
      const notes = [392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        
        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.06, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.45);
      });
      break;
    }

    // === REVISION / CAUTION SOUNDS ===
    case 'dissonant': {
      // Descending tritones for alerting: F#4 (369.99) -> C4 (261.63)
      const notes = [369.99, 261.63];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth'; // Slightly richer wave to attract attention
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        
        // Lowpass filter to avoid harshness
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.06, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.4);
      });
      break;
    }

    case 'buzz': {
      // Dual low pulse at 160Hz and 130Hz
      const freqs = [160, 130];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.3);
      });
      break;
    }

    case 'descend': {
      // Descending minor chord: A4 (440.00), F4 (349.23), D4 (293.66)
      const notes = [440.00, 349.23, 293.66];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);

        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.07, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.35);
      });
      break;
    }
  }
};
