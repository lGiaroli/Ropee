import { Dumbbell } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { RoutinePhaseType } from '@/types/domain';

interface WorkoutPhaseIconProps {
  phaseType?: RoutinePhaseType;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

// Jump-rope and stretching paths are from Tabler Icons (MIT):
// https://tabler.io/icons/icon/jump-rope and https://tabler.io/icons/icon/stretching
export const WorkoutPhaseIcon = ({
  phaseType,
  size = 24,
  color = '#171427',
  strokeWidth = 2,
}: WorkoutPhaseIconProps) => {
  if (phaseType === 'strength') {
    return <Dumbbell size={size} color={color} strokeWidth={strokeWidth} />;
  }

  if (phaseType === 'jump') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6 14v-6a3 3 0 1 1 6 0v8a3 3 0 0 0 6 0v-6"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M16 5a2 2 0 0 1 2 -2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2l0 -3"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4 16a2 2 0 0 1 2 -2a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2a2 2 0 0 1 -2 -2l0 -3"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 20l5 -.5l1 -2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 20v-5h-5.5l2.5 -6.5l-5.5 1l1.5 2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
