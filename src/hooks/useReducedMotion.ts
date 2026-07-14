import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let initialized = false;
let reducedMotion = false;
let nativeSubscription: ReturnType<typeof AccessibilityInfo.addEventListener> | undefined;
const listeners = new Set<() => void>();

const updateReducedMotion = (enabled: boolean) => {
  if (reducedMotion === enabled) return;
  reducedMotion = enabled;
  listeners.forEach((listener) => listener());
};

const ensureSubscription = () => {
  if (initialized) return;
  initialized = true;

  AccessibilityInfo.isReduceMotionEnabled()
    .then(updateReducedMotion)
    .catch(() => undefined);
  nativeSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', updateReducedMotion);
};

const subscribe = (listener: () => void) => {
  ensureSubscription();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      nativeSubscription?.remove();
      nativeSubscription = undefined;
      initialized = false;
    }
  };
};

const getSnapshot = () => reducedMotion;
const getServerSnapshot = () => false;

export const useReducedMotion = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
