import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
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

const cuePlaybackRate: Record<CueType, number> = {
  jump: 1.35,
  rest: 0.82,
  long_rest: 0.66,
  countdown: 1.12,
  finish: 1.62,
  strength: 0.96,
};

const nativeCue = require('../../assets/audio/ropee-cue.wav');
let nativeCuePlayer: ReturnType<typeof createAudioPlayer> | undefined;
let audioModeReady: Promise<void> | undefined;

const cueHaptic: Record<CueType, Haptics.ImpactFeedbackStyle> = {
  jump: Haptics.ImpactFeedbackStyle.Medium,
  rest: Haptics.ImpactFeedbackStyle.Light,
  long_rest: Haptics.ImpactFeedbackStyle.Heavy,
  countdown: Haptics.ImpactFeedbackStyle.Light,
  finish: Haptics.ImpactFeedbackStyle.Heavy,
  strength: Haptics.ImpactFeedbackStyle.Medium,
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
  if (profile.hapticsEnabled || profile.vibrationOnly) {
    await Haptics.impactAsync(cueHaptic[cue]).catch(() => undefined);
  }

  if (!profile.soundEnabled || profile.silentMode || profile.vibrationOnly) return;

  if (Platform.OS === 'web') {
    playWebTone(cueTone[cue]);
    return;
  }

  await playNativeCue(cue);
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
  if (!profile.voiceEnabled) return;
  Speech.stop().catch(() => undefined);
  Speech.speak(message, {
    language: 'es-AR',
    pitch,
    rate,
  });
};

const playNativeCue = async (cue: CueType) => {
  audioModeReady ??= setAudioModeAsync({
    allowsRecording: false,
    interruptionMode: 'mixWithOthers',
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  });
  await audioModeReady;

  nativeCuePlayer ??= createAudioPlayer(nativeCue, { keepAudioSessionActive: true });
  nativeCuePlayer.pause();
  nativeCuePlayer.playbackRate = cuePlaybackRate[cue];
  nativeCuePlayer.volume = cue === 'finish' ? 0.62 : 0.48;
  await nativeCuePlayer.seekTo(0);
  nativeCuePlayer.play();
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
