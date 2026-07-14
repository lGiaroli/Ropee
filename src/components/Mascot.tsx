import { useEffect, useMemo, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export type MascotMood = 'ready' | 'wave' | 'jump' | 'train' | 'focus' | 'angry' | 'celebrate';

interface MascotProps {
  size?: number;
  mood?: MascotMood;
  sequence?: MascotMood[];
  animated?: boolean;
  jumpMotionEnabled?: boolean;
}

const ropiJump = require('../../assets/mascot/ropi-jump.png');
const ropiJumpFrames = [
  require('../../assets/mascot/jump-frames/ropi-jump-frame-1.png'),
  require('../../assets/mascot/jump-frames/ropi-jump-frame-2.png'),
  require('../../assets/mascot/jump-frames/ropi-jump-frame-3.png'),
];

const motionProfile: Record<MascotMood, { y: number; rotateA: string; rotateB: string; scaleA: number; scaleB: number; duration: number }> = {
  ready: { y: -4, rotateA: '-1deg', rotateB: '1deg', scaleA: 1, scaleB: 1.02, duration: 1100 },
  wave: { y: -5, rotateA: '-2deg', rotateB: '2deg', scaleA: 1, scaleB: 1.03, duration: 820 },
  jump: { y: -6, rotateA: '-1deg', rotateB: '1deg', scaleA: 0.998, scaleB: 1.02, duration: 480 },
  train: { y: -7, rotateA: '-1.2deg', rotateB: '1.2deg', scaleA: 0.996, scaleB: 1.024, duration: 420 },
  focus: { y: -3, rotateA: '-0.5deg', rotateB: '0.5deg', scaleA: 1, scaleB: 1.01, duration: 1300 },
  angry: { y: -2, rotateA: '-5deg', rotateB: '5deg', scaleA: 1, scaleB: 1.02, duration: 180 },
  celebrate: { y: -14, rotateA: '-5deg', rotateB: '5deg', scaleA: 1, scaleB: 1.08, duration: 420 },
};
const stillProfile = { y: 0, rotateA: '0deg', rotateB: '0deg', scaleA: 1, scaleB: 1, duration: 420 };

export const Mascot = ({ size = 96, mood = 'ready', sequence, animated = true, jumpMotionEnabled = false }: MascotProps) => {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [jumpFrameIndex, setJumpFrameIndex] = useState(0);
  const moods = useMemo(() => (sequence?.length ? sequence : [mood]), [mood, sequence]);
  const sequenceKey = moods.join('|');
  const activeMood = moods[sequenceIndex % moods.length] ?? mood;
  const usesJumpMotion = jumpMotionEnabled && (activeMood === 'jump' || activeMood === 'train');
  const profile = usesJumpMotion ? stillProfile : motionProfile[activeMood];

  useEffect(() => {
    if (!animated || reducedMotion || usesJumpMotion) {
      progress.setValue(0);
      return undefined;
    }

    progress.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: profile.duration,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 0,
        duration: profile.duration,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [animated, profile.duration, progress, reducedMotion, usesJumpMotion]);

  useEffect(() => {
    if (!animated || reducedMotion || !usesJumpMotion) return undefined;

    const loop = setInterval(() => {
      setJumpFrameIndex((index) => (index + 1) % ropiJumpFrames.length);
    }, 160);
    return () => clearInterval(loop);
  }, [animated, reducedMotion, usesJumpMotion]);

  useEffect(() => {
    if (!animated || reducedMotion || moods.length <= 1) return undefined;
    const resetTimer = setTimeout(() => setSequenceIndex(0), 0);
    const timers = Array.from({ length: moods.length - 1 }).map((_, index) =>
      setTimeout(() => setSequenceIndex(index + 1), (index + 1) * 2200),
    );
    return () => {
      clearTimeout(resetTimer);
      timers.forEach(clearTimeout);
    };
  }, [animated, moods.length, reducedMotion, sequenceKey]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, profile.y],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.rotateA, profile.rotateB],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [profile.scaleA, profile.scaleB],
  });
  const visibleJumpFrameIndex = animated && !reducedMotion && usesJumpMotion ? jumpFrameIndex : 0;

  return (
    <View style={[styles.box, { width: size, height: size }]} accessibilityLabel="Ropi, guia de RopeQuest">
      <Animated.View style={[styles.stage, { width: size, height: size, transform: [{ translateY }, { rotate }, { scale }] }]}>
        <Image
          source={usesJumpMotion ? ropiJumpFrames[visibleJumpFrameIndex] : ropiJump}
          resizeMode="contain"
          style={[styles.image, { width: size, height: size }]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
