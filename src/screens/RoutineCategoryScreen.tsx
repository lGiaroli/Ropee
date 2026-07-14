import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Heart,
  Target,
  Trophy,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import {
  findRoutineCategory,
  RoutineCategory,
  RoutineCategoryIcon,
  RoutineCategoryId,
} from '@/data/routineCatalog';
import { estimateCalories } from '@/features/progress/stats';
import { NavigationProps } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { WorkoutRoutine } from '@/types/domain';

const routineHeroTrainingArea = require('../../assets/routines/routine-hero-training-area.png');

interface CategoryPresentation {
  calories: string;
  focus: string;
  heading: string;
  intensity: string;
  pill: string;
  subtitle: string;
}

const categoryPresentation: Record<RoutineCategoryId, CategoryPresentation> = {
  short: {
    calories: '80-180',
    focus: 'Rápido',
    heading: 'Rutinas para moverte rápido',
    intensity: 'Suave',
    pill: 'Cortas',
    subtitle: 'Sesiones cortas para activar el cuerpo incluso en días ocupados.',
  },
  fatBurn: {
    calories: '300-500',
    focus: 'Cardio',
    heading: 'Rutinas para quemar calorías',
    intensity: 'Intermedia',
    pill: 'Quema Grasa',
    subtitle: 'Sesiones diseñadas para acelerar tu metabolismo y ayudarte a perder grasa mientras te divertís.',
  },
  strengthCardio: {
    calories: '180-420',
    focus: 'Fuerza',
    heading: 'Rutinas de\nfuerza y cardio',
    intensity: 'Mixta',
    pill: 'Fuerza + Cardio',
    subtitle: 'Circuitos con soga, core, piernas\ny empuje para entrenar todo el cuerpo.',
  },
  challenge: {
    calories: '500-900',
    focus: 'Resistencia',
    heading: 'Retos para subir de nivel',
    intensity: 'Avanzada',
    pill: 'Desafío',
    subtitle: 'Entrenos largos y exigentes para desbloquear marcas nuevas sin perder técnica.',
  },
  relax: {
    calories: 'Movilidad',
    focus: 'Recuperar',
    heading: 'Rutinas para recuperar',
    intensity: 'Suave',
    pill: 'Relajación',
    subtitle: 'Movilidad, respiración y descarga para volver mejor al próximo entrenamiento.',
  },
};

const categoryLabelColor: Record<RoutineCategoryId, string> = {
  challenge: '#C76412',
  fatBurn: '#1F9A58',
  relax: '#C94F83',
  short: '#6F47D8',
  strengthCardio: '#2E7CC6',
};

export const RoutineCategoryScreen = ({ route, navigate }: NavigationProps) => {
  const category = findRoutineCategory(route.categoryId);
  const routines = useAppStore((state) => state.routines);
  const weightKg = useAppStore((state) => state.profile.weightKg);
  const jumpCadenceSpm = useAppStore((state) => state.profile.jumpCadenceSpm);
  const categoryRoutines = category.routineIds
    .map((routineId) => routines.find((routine) => routine.id === routineId))
    .filter((routine): routine is WorkoutRoutine => Boolean(routine));
  const presentation = categoryPresentation[category.id];
  const labelColor = categoryLabelColor[category.id];
  const categoryCalories =
    category.id === 'relax'
      ? presentation.calories
      : formatCalorieRange(
          categoryRoutines.map((routine) =>
            estimateCalories(routine.estimatedJumpDuration, weightKg, routineIntensity(routine), jumpCadenceSpm),
          ),
        );

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.heroSection}>
        <MotionReveal distance={6} duration={460} fromScale={0.995} style={styles.heroCard}>
          <Image source={routineHeroTrainingArea} resizeMode="cover" style={styles.heroImage} />
          <View pointerEvents="none" style={styles.heroWhiteFade} />
          <View pointerEvents="none" style={styles.heroBottomFade} />

          <View style={styles.topControls}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="Volver a rutinas"
              onPress={() => navigate({ name: 'routines' })}
              pressedScale={0.92}
              style={({ pressed }) => [styles.backButton, pressed ? styles.controlPressed : null]}
            >
              <ArrowLeft size={21} color="#7F8BB3" strokeWidth={3} />
            </MotionPressable>

            <View />
          </View>

          <View style={styles.heroCopy}>
            <View style={styles.categoryLabel}>
              <CategoryIcon icon={category.icon} color={labelColor} size={15} />
              <AppText weight="800" style={[styles.categoryLabelText, { color: labelColor }]}>
                {presentation.pill}
              </AppText>
            </View>

            <AppText weight="800" style={styles.heroTitle}>
              {presentation.heading}
            </AppText>
            <AppText weight="700" style={styles.heroSubtitle}>
              {presentation.subtitle}
            </AppText>
          </View>
        </MotionReveal>

        <MotionReveal delay={110} distance={6} style={styles.heroStatsPanel}>
          <HeroStat
            icon={<Clock3 size={16} color={category.accent} strokeWidth={3} />}
            label="Duración"
            value={category.range}
          />
          <HeroStat
            icon={<Flame size={16} color="#FF7A34" fill="#FF7A34" />}
            label={category.id === 'relax' ? 'Tipo' : 'Calorías'}
            value={categoryCalories}
          />
          <HeroStat
            icon={<BarChart3 size={16} color="#24C36A" strokeWidth={3} />}
            label="Intensidad"
            value={presentation.intensity}
          />
          <HeroStat
            icon={<Target size={16} color="#24C36A" strokeWidth={3} />}
            label="Enfoque"
            value={presentation.focus}
          />
        </MotionReveal>
      </View>

      <MotionReveal delay={170} distance={5}>
        <View style={styles.listHeader}>
          <AppText weight="800" style={styles.sectionTitle}>
            Rutinas disponibles
          </AppText>
        </View>
      </MotionReveal>

      <View style={styles.routineList}>
        {categoryRoutines.map((routine, index) => (
          <MotionReveal key={routine.id} delay={220 + index * 65} distance={7} fromScale={0.99}>
            <CategoryRoutineCard
              category={category}
              index={index}
              onOpen={() => navigate({ name: 'routineDetail', routineId: routine.id })}
              onStart={() => navigate({ name: 'timer', routineId: routine.id })}
              jumpCadenceSpm={jumpCadenceSpm}
              routine={routine}
              weightKg={weightKg}
            />
          </MotionReveal>
        ))}
      </View>
    </Screen>
  );
};

const CategoryRoutineCard = ({
  category,
  index,
  jumpCadenceSpm,
  onOpen,
  onStart,
  routine,
  weightKg,
}: {
  category: RoutineCategory;
  index: number;
  jumpCadenceSpm?: number;
  onOpen: () => void;
  onStart: () => void;
  routine: WorkoutRoutine;
  weightKg?: number;
}) => {
  const calories = estimateCalories(routine.estimatedJumpDuration, weightKg, routineIntensity(routine), jumpCadenceSpm);
  const isRelax = category.id === 'relax';
  const minutes = Math.max(1, Math.round(routine.estimatedDuration / 60));
  const primary = index === 0;

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${routine.name}`}
      onPress={onOpen}
      pressedScale={0.985}
      style={({ pressed }) => [styles.routineCard, pressed ? styles.routineCardPressed : null]}
    >
      <RoutineMinuteBadge color={category.accent} minutes={minutes} />

      <View style={styles.routineInfo}>
        {primary ? (
          <View style={[styles.popularChip, { backgroundColor: `${category.accent}14` }]}>
            <AppText weight="800" style={[styles.popularText, { color: category.accent }]}>
              MÁS POPULAR
            </AppText>
          </View>
        ) : null}

        <View style={styles.routineTitleRow}>
          <AppText weight="800" style={styles.routineTitle} numberOfLines={1} adjustsFontSizeToFit>
            {routine.name}
          </AppText>
        </View>

        <AppText weight="700" style={styles.routineBody} numberOfLines={2}>
          {routine.description}
        </AppText>

        <View style={styles.routineMetaRow}>
          <SmallMeta icon={<Clock3 size={11} color="#8E8AA4" strokeWidth={2.7} />} text={`${minutes} min`} />
          <SmallMeta
            icon={isRelax ? <Heart size={11} color="#FF7A34" fill="#FF7A34" /> : <Flame size={11} color="#FF7A34" fill="#FF7A34" />}
            text={isRelax ? 'movilidad' : `${calories} kcal`}
          />
          <SmallMeta icon={<BarChart3 size={11} color="#31C77A" strokeWidth={3} />} text={routineDifficultyLabel(routine.difficulty)} />
        </View>
      </View>

      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={`Comenzar ${routine.name}`}
        onPress={onStart}
        pressedScale={0.92}
        style={({ pressed }) => [styles.roundStartButton, pressed ? styles.startButtonPressed : null]}
      >
        <ChevronRight size={23} color="#7B4DFF" strokeWidth={3.1} />
      </MotionPressable>
    </MotionPressable>
  );
};

const HeroStat = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) => (
  <View style={styles.heroStat}>
    <View style={styles.heroStatIcon}>{icon}</View>
    <View style={styles.heroStatCopy}>
      <AppText weight="800" style={styles.heroStatValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText weight="700" style={styles.heroStatLabel} numberOfLines={1} adjustsFontSizeToFit>
        {label}
      </AppText>
    </View>
  </View>
);

const RoutineMinuteBadge = ({ color, minutes }: { color: string; minutes: number }) => (
  <View style={[styles.minuteBadgeHalo, { backgroundColor: `${color}12` }]}>
    <View style={[styles.minuteBadgeOuter, { borderColor: `${color}28` }]}>
      <View style={[styles.minuteBadgeInner, { borderColor: color }]}>
        <View style={[styles.minuteBadgeTop, { backgroundColor: color }]} />
        <AppText weight="800" style={[styles.minuteBadgeNumber, { color }]}>
          {minutes}
        </AppText>
        <AppText weight="800" style={[styles.minuteBadgeUnit, { color }]}>
          min
        </AppText>
      </View>
    </View>
  </View>
);

const SmallMeta = ({ icon, text }: { icon: ReactNode; text: string }) => (
  <View style={styles.smallMeta}>
    {icon}
    <AppText weight="700" style={styles.smallMetaText} numberOfLines={1} adjustsFontSizeToFit>
      {text}
    </AppText>
  </View>
);

const routineDifficultyLabel = (difficulty: WorkoutRoutine['difficulty']) => {
  if (difficulty === 'advanced') return 'Avanzada';
  if (difficulty === 'medium') return 'Intermedia';
  return 'Principiante';
};

const routineIntensity = (routine: WorkoutRoutine) => {
  if (routine.difficulty === 'advanced') return 11;
  if (routine.difficulty === 'medium') return 10;
  return 8;
};

const formatCalorieRange = (values: number[]) => {
  const positiveValues = values.filter((value) => value > 0);
  if (positiveValues.length === 0) return '0';
  const min = Math.min(...positiveValues);
  const max = Math.max(...positiveValues);
  return min === max ? String(min) : `${min}-${max}`;
};

const CategoryIcon = ({ color, icon, size }: { color: string; icon: RoutineCategoryIcon; size: number }) => {
  if (icon === 'clock') return <Clock3 size={size} color={color} strokeWidth={2.8} />;
  if (icon === 'flame') return <Flame size={size} color={color} fill={color} />;
  if (icon === 'dumbbell') return <Dumbbell size={size} color={color} strokeWidth={2.8} />;
  if (icon === 'trophy') return <Trophy size={size} color={color} fill="#FFB15E" strokeWidth={2.4} />;
  return <Heart size={size} color={color} fill={color} />;
};

const styles = StyleSheet.create({
  screenContent: {
    gap: 11,
    paddingTop: 0,
  },
  heroSection: {
    minHeight: 316,
    marginHorizontal: -18,
    marginTop: -1,
    marginBottom: 2,
    position: 'relative',
  },
  heroCard: {
    height: 286,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#EAF4FF',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    right: -84,
    bottom: 0,
    width: '137%',
    height: '100%',
  },
  heroWhiteFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...({
      backgroundImage:
        'linear-gradient(90deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.82) 26%, rgba(255,255,255,0.66) 49%, rgba(255,255,255,0.32) 72%, rgba(255,255,255,0.06) 100%)',
    } as any),
  },
  heroBottomFade: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 106,
    ...({
      backgroundImage: 'linear-gradient(180deg, rgba(250,250,255,0) 0%, rgba(250,250,255,0.86) 100%)',
    } as any),
  },
  topControls: {
    position: 'absolute',
    top: 26,
    left: 28,
    right: 28,
    minHeight: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    shadowColor: '#37518A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  controlPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  heartChip: {
    minWidth: 67,
    height: 39,
    borderRadius: 999,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    shadowColor: '#37518A',
    shadowOpacity: 0.09,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heartText: {
    color: '#211D33',
    fontSize: 13,
    lineHeight: 16,
  },
  heroCopy: {
    position: 'absolute',
    left: 30,
    top: 83,
    width: 238,
    zIndex: 4,
  },
  categoryLabel: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLabelText: {
    fontSize: 11.5,
    lineHeight: 14,
  },
  heroTitle: {
    color: '#1F1A33',
    fontSize: 24,
    lineHeight: 27,
    marginTop: 11,
    maxWidth: 220,
  },
  heroSubtitle: {
    color: '#5D5871',
    fontSize: 10.2,
    lineHeight: 14,
    marginTop: 9,
    maxWidth: 237,
  },
  heroStatsPanel: {
    position: 'absolute',
    left: 29,
    right: 29,
    bottom: 0,
    minHeight: 72,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 10,
    paddingVertical: 11,
    shadowColor: '#5B4DB8',
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    zIndex: 10,
  },
  heroStat: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 3,
  },
  heroStatIcon: {
    width: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatCopy: {
    flexShrink: 1,
    minWidth: 0,
  },
  heroStatValue: {
    color: '#201B33',
    fontSize: 9,
    lineHeight: 11,
  },
  heroStatLabel: {
    color: '#8C87A1',
    fontSize: 7.2,
    lineHeight: 9,
    marginTop: 2,
  },
  listHeader: {
    minHeight: 22,
    justifyContent: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#211D33',
    fontSize: 13,
    lineHeight: 16,
  },
  routineList: {
    gap: 10,
  },
  routineCard: {
    minHeight: 111,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1ECF8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 13,
    paddingVertical: 12,
    gap: 13,
    shadowColor: '#6D5AB8',
    shadowOpacity: 0.055,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  routineCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  minuteBadgeHalo: {
    width: 74,
    height: 74,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minuteBadgeOuter: {
    width: 64,
    height: 64,
    borderRadius: 999,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  minuteBadgeInner: {
    width: 50,
    height: 50,
    borderRadius: 999,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  minuteBadgeTop: {
    position: 'absolute',
    top: -9,
    width: 16,
    height: 7,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  minuteBadgeNumber: {
    fontSize: 20,
    lineHeight: 21,
    marginTop: 2,
  },
  minuteBadgeUnit: {
    fontSize: 8,
    lineHeight: 9,
    marginTop: -1,
  },
  routineInfo: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  popularChip: {
    alignSelf: 'flex-start',
    minHeight: 15,
    borderRadius: 999,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  popularText: {
    fontSize: 6.5,
    lineHeight: 8,
  },
  routineTitleRow: {
    minHeight: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  routineTitle: {
    flex: 1,
    minWidth: 0,
    color: '#211D33',
    fontSize: 13.2,
    lineHeight: 16,
  },
  routineBody: {
    color: '#666079',
    fontSize: 8.9,
    lineHeight: 12,
    marginTop: 2,
  },
  routineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  smallMeta: {
    maxWidth: 76,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  smallMetaText: {
    flex: 1,
    minWidth: 0,
    color: '#5F5872',
    fontSize: 7.5,
    lineHeight: 9,
  },
  roundStartButton: {
    width: 45,
    height: 45,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EAF7',
    shadowColor: '#6D5AB8',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  startButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});
