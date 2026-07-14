import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { CueType, UserProfile, WorkoutPhase } from '@/types/domain';

const cueTone: Record<CueType, number> = {
  jump: 880,
  rest: 440,
  long_rest: 330,
  countdown: 660,
  finish: 1046,
  strength: 523,
};

const cueFallback: Record<CueType, { pitch: number; rate: number; haptic: Haptics.ImpactFeedbackStyle }> = {
  jump: { pitch: 1.15, rate: 1.05, haptic: Haptics.ImpactFeedbackStyle.Medium },
  rest: { pitch: 0.85, rate: 0.95, haptic: Haptics.ImpactFeedbackStyle.Light },
  long_rest: { pitch: 0.75, rate: 0.9, haptic: Haptics.ImpactFeedbackStyle.Heavy },
  countdown: { pitch: 1.25, rate: 1.15, haptic: Haptics.ImpactFeedbackStyle.Light },
  finish: { pitch: 1.05, rate: 0.95, haptic: Haptics.ImpactFeedbackStyle.Heavy },
  strength: { pitch: 0.95, rate: 1, haptic: Haptics.ImpactFeedbackStyle.Medium },
};

export const cueForPhase = (phase: WorkoutPhase): CueType => {
  if (phase.type === 'jump') return 'jump';
  if (phase.type === 'long_rest') return 'long_rest';
  if (phase.type === 'strength') return 'strength';
  if (phase.type === 'cooldown' || phase.type === 'recovery' || phase.type === 'short_rest') return 'rest';
  return 'rest';
};

export const speakPhase = async (phase: WorkoutPhase, profile: UserProfile) => {
  if (!profile.voiceEnabled || profile.silentMode || profile.vibrationOnly) return;
  const message =
    phase.type === 'jump'
      ? `Saltamos ${phase.durationSeconds} segundos. ${phase.message}`
      : phase.type === 'long_rest'
        ? 'Descanso largo, recuperá el aire.'
        : phase.type === 'strength'
          ? phase.message
          : phase.message;
  await speak(message, profile);
};

export const playCue = async (cue: CueType, profile: UserProfile) => {
  const fallback = cueFallback[cue];
  if (profile.hapticsEnabled || profile.vibrationOnly) {
    await Haptics.impactAsync(fallback.haptic).catch(() => undefined);
  }

  if (!profile.soundEnabled || profile.silentMode || profile.vibrationOnly) return;

  if (Platform.OS === 'web') {
    playWebTone(cueTone[cue]);
    return;
  }

  await speak(cueLabel(cue), profile, fallback.pitch, fallback.rate);
};

export const speakCountdown = async (seconds: number, profile: UserProfile) => {
  if (!profile.voiceEnabled || profile.silentMode || profile.vibrationOnly) {
    await playCue('countdown', profile);
    return;
  }
  await speak(String(seconds), profile, 1.15, 1.1);
};

export const stopSpeech = () => {
  Speech.stop().catch(() => undefined);
};

const speak = async (message: string, profile: UserProfile, pitch = 1, rate = 1) => {
  if (Platform.OS === 'web' && !('speechSynthesis' in window)) return;
  if (!profile.voiceEnabled && message !== 'beep') return;
  Speech.stop().catch(() => undefined);
  Speech.speak(message, {
    language: 'es-AR',
    pitch,
    rate,
  });
};

const playWebTone = (frequency: number) => {
  if (typeof window === 'undefined') return;
  const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextClass = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.17);
  setTimeout(() => {
    context.close().catch(() => undefined);
  }, 250);
};

const cueLabel = (cue: CueType) => {
  switch (cue) {
    case 'jump':
      return 'Salto';
    case 'rest':
      return 'Descanso';
    case 'long_rest':
      return 'Descanso largo';
    case 'finish':
      return 'Entrenamiento completado';
    case 'strength':
      return 'Fuerza';
    default:
      return 'Beep';
  }
};
