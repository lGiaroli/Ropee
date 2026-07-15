import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronRight, Clock3, Dumbbell, Flame, Heart, Leaf, MoreHorizontal, Plus, Star, Trophy } from 'lucide-react-native';
import { Animated, Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { MotionPressable } from '@/components/MotionPressable';
import { MotionReveal } from '@/components/MotionReveal';
import { Screen } from '@/components/Screen';
import { RoutineCategory, routineCategories } from '@/data/routineCatalog';
import { estimateCalories } from '@/features/progress/stats';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { NavigationProps } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing } from '@/theme/tokens';
import { WorkoutRoutine } from '@/types/domain';

const routineTabIcon = require('../../assets/icons/nav/tab-routines.png');
const routineHeroTrainingArea = require('../../assets/routines/routine-hero-training-area.webp');
const routineRopiJump = require('../../assets/routines/ropi-routine-jump-cutout.webp');

interface RoutineTab {
  icon?: ImageSourcePropType;
  label: string;
  name: 'library' | 'mine' | 'favorites';
}

interface RecommendationCardData {
  accent: string;
  background: string;
  border: string;
  button: string;
  chipBackground: string;
  chipIcon: 'flame' | 'leaf' | 'trophy';
  chipText: string;
  difficulty: string;
  difficultyColor: string;
  intensity: number;
  minutes: number;
  routineId: string;
  title: string;
}

const tabs: RoutineTab[] = [
  { icon: routineTabIcon, label: 'Rutinas', name: 'library' },
  { label: 'Mis rutinas', name: 'mine' },
  { label: 'Favoritas', name: 'favorites' },
];

const SEGMENT_GAP = 4;

const RoutineSegmentTab = ({
  onPress,
  selected,
  tab,
}: {
  onPress: () => void;
  selected: boolean;
  tab: RoutineTab;
}) => {
  const reducedMotion = useReducedMotion();
  const [selection] = useState(() => new Animated.Value(selected ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      selection.setValue(selected ? 1 : 0);
      return undefined;
    }

    const animation = Animated.spring(selection, {
      toValue: selected ? 1 : 0,
      damping: 18,
      stiffness: 270,
      mass: 0.55,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, selected, selection]);

  const contentOpacity = selection.interpolate({
    inputRange: [0, 1],
    outputRange: [0.68, 1],
  });
  const contentScale = selection.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <MotionPressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={tab.label}
      containerStyle={styles.segmentItemMotion}
      onPress={onPress}
      pressedScale={0.965}
      style={({ pressed }) => [styles.segmentItem, pressed ? styles.segmentItemPressed : null]}
    >
      <Animated.View
        style={[
          styles.segmentItemContent,
          { opacity: contentOpacity, transform: [{ scale: contentScale }] },
        ]}
      >
        {tab.icon ? (
          <Image source={tab.icon} resizeMode="contain" style={[styles.segmentImage, selected ? styles.segmentImageSelected : null]} />
        ) : tab.name === 'mine' ? (
          <Star size={15} color={selected ? '#7257FF' : '#8C879D'} fill={selected ? '#7257FF' : 'transparent'} />
        ) : (
          <Heart size={15} color={selected ? '#7257FF' : '#8C879D'} fill={selected ? '#7257FF' : '#8C879D'} />
        )}
        <AppText weight="800" style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}>
          {tab.label}
        </AppText>
      </Animated.View>
    </MotionPressable>
  );
};

const recommendations: RecommendationCardData[] = [
  {
    accent: '#7657FF',
    background: '#F5F0FF',
    border: '#DFD0FF',
    button: '#7657FF',
    chipBackground: '#FFEDEA',
    chipIcon: 'flame',
    chipText: 'Popular',
    difficulty: 'Intermedio',
    difficultyColor: '#5F7CFF',
    intensity: 10,
    minutes: 20,
    routineId: 'pomodoro-medium',
    title: 'Quema rápida',
  },
  {
    accent: '#33C77D',
    background: '#EDFFF6',
    border: '#BEEFD8',
    button: '#31C77A',
    chipBackground: '#DFFBEA',
    chipIcon: 'leaf',
    chipText: 'Principiante',
    difficulty: 'Principiante',
    difficultyColor: '#31C77A',
    intensity: 8,
    minutes: 10,
    routineId: 'initial-6x20',
    title: 'Empieza ligero',
  },
  {
    accent: '#FF8A33',
    background: '#FFF4E8',
    border: '#FFD7B2',
    button: '#FF8A33',
    chipBackground: '#FFE8D4',
    chipIcon: 'trophy',
    chipText: 'Desafío',
    difficulty: 'Avanzado',
    difficultyColor: '#FF8A33',
    intensity: 11,
    minutes: 30,
    routineId: 'long-80x25',
    title: 'Desafío total',
  },
];

const RoutineTabPanel = ({
  actionLabel,
  emptyBody,
  emptyTitle,
  icon,
  onAction,
  onOpen,
  routines,
  title,
}: {
  actionLabel: string;
  emptyBody: string;
  emptyTitle: string;
  icon: 'heart' | 'star';
  onAction: () => void;
  onOpen: (routineId: string) => void;
  routines: WorkoutRoutine[];
  title: string;
}) => (
  <MotionReveal delay={40} distance={6} fromScale={0.99} style={styles.tabPanel}>
    <View style={styles.sectionHeader}>
      <AppText weight="800" style={styles.sectionTitle}>
        {title}
      </AppText>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        pressedScale={0.96}
        style={({ pressed }) => [styles.createRoutineLink, { opacity: pressed ? 0.72 : 1 }]}
      >
        <AppText weight="800" style={styles.sectionLink}>
          {actionLabel}
        </AppText>
        <View style={styles.createRoutinePlus}>
          {icon === 'star' ? <Plus size={10} color="#7657FF" strokeWidth={3} /> : <ChevronRight size={11} color="#7657FF" strokeWidth={3} />}
        </View>
      </MotionPressable>
    </View>

    {routines.length > 0 ? (
      <View style={styles.tabRoutineList}>
        {routines.slice(0, 5).map((routine, index) => (
          <MotionReveal key={routine.id} delay={90 + index * 45} distance={5} fromScale={0.99}>
            <RoutineTabCard icon={icon} onPress={() => onOpen(routine.id)} routine={routine} />
          </MotionReveal>
        ))}
      </View>
    ) : (
      <MotionReveal delay={100} distance={5} fromScale={0.985} style={styles.emptyTabCard}>
        <View style={styles.emptyTabIcon}>
          {icon === 'star' ? (
            <Star size={24} color="#7657FF" fill="#E7DCFF" strokeWidth={2.4} />
          ) : (
            <Heart size={24} color="#FF6FA8" fill="#FFE0EE" strokeWidth={2.4} />
          )}
        </View>
        <View style={styles.emptyTabCopy}>
          <AppText weight="800" style={styles.emptyTabTitle}>
            {emptyTitle}
          </AppText>
          <AppText weight="700" style={styles.emptyTabBody}>
            {emptyBody}
          </AppText>
        </View>
      </MotionReveal>
    )}
  </MotionReveal>
);

const RoutineTabCard = ({
  icon,
  onPress,
  routine,
}: {
  icon: 'heart' | 'star';
  onPress: () => void;
  routine: WorkoutRoutine;
}) => {
  const minutes = Math.max(1, Math.round(routine.estimatedDuration / 60));

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${routine.name}`}
      onPress={onPress}
      pressedScale={0.98}
      style={({ pressed }) => [styles.tabRoutineCard, { opacity: pressed ? 0.78 : 1 }]}
    >
      <View style={styles.tabRoutineIcon}>
        {icon === 'star' ? <Star size={18} color="#7657FF" fill="#E7DCFF" /> : <Heart size={18} color="#FF6FA8" fill="#FF6FA8" />}
      </View>
      <View style={styles.tabRoutineCopy}>
        <AppText weight="800" style={styles.tabRoutineTitle} numberOfLines={1}>
          {routine.name}
        </AppText>
        <AppText weight="700" style={styles.tabRoutineMeta} numberOfLines={1}>
          {minutes} min · {routine.difficulty === 'advanced' ? 'Avanzada' : routine.difficulty === 'medium' ? 'Intermedia' : 'Principiante'}
        </AppText>
      </View>
      <View style={styles.tabRoutineArrow}>
        <ChevronRight size={18} color="#7657FF" strokeWidth={3} />
      </View>
    </MotionPressable>
  );
};

export const RoutineLibraryScreen = ({ navigate }: NavigationProps) => {
  const [activeTab, setActiveTab] = useState<RoutineTab['name']>('library');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [segmentIndicatorX] = useState(() => new Animated.Value(0));
  const reducedMotion = useReducedMotion();
  const routines = useAppStore((state) => state.routines);
  const currentStreak = useAppStore((state) => state.gamification.currentStreak);
  const weightKg = useAppStore((state) => state.profile.weightKg);
  const jumpCadenceSpm = useAppStore((state) => state.profile.jumpCadenceSpm);
  const toggleFavoriteRoutine = useAppStore((state) => state.toggleFavoriteRoutine);
  const customRoutines = useMemo(() => routines.filter((routine) => routine.isCustom), [routines]);
  const favoriteRoutines = useMemo(() => routines.filter((routine) => routine.isFavorite), [routines]);
  const segmentItemWidth = segmentWidth > 0
    ? (segmentWidth - SEGMENT_GAP * (tabs.length - 1)) / tabs.length
    : 0;

  const selectRoutineTab = (tabName: RoutineTab['name'], tabIndex: number) => {
    setActiveTab(tabName);
    if (segmentItemWidth <= 0) return;

    const nextX = tabIndex * (segmentItemWidth + SEGMENT_GAP);
    segmentIndicatorX.stopAnimation();
    if (reducedMotion) {
      segmentIndicatorX.setValue(nextX);
      return;
    }

    Animated.spring(segmentIndicatorX, {
      toValue: nextX,
      damping: 20,
      stiffness: 250,
      mass: 0.62,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Screen contentStyle={styles.screenContent}>
      <MotionReveal distance={6} duration={460} fromScale={0.995} style={styles.heroPanel}>
        <Image source={routineHeroTrainingArea} resizeMode="cover" style={styles.heroBackgroundImage} />
        <View pointerEvents="none" style={styles.heroImageTint} />

        <View style={styles.heroContent}>
          <AppText weight="800" style={styles.heroTitle}>
            Tu constancia{'\n'}es tu superpoder✨
          </AppText>

          <View style={styles.streakChip}>
            <Flame size={11} color="#FF7B2F" fill="#FF7B2F" />
            <AppText weight="800" style={styles.streakChipText}>
              Racha actual: {currentStreak} días
            </AppText>
          </View>

          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Ver mi progreso"
            onPress={() => navigate({ name: 'stats' })}
            pressedScale={0.97}
            style={({ pressed }) => [styles.progressButton, { opacity: pressed ? 0.82 : 1 }]}
          >
            <AppText weight="800" style={styles.progressButtonText}>
              Ver mi progreso
            </AppText>
            <BarChart3 size={15} color="#7257FF" strokeWidth={2.7} />
          </MotionPressable>
        </View>

        <View pointerEvents="none" style={styles.heroReservedArea}>
          <View style={styles.heroRopiAuraOuter} />
          <View style={styles.heroRopiAuraInner} />
          <View style={styles.heroRopiShadowSoft} />
          <View style={styles.heroRopiShadow} />
          <View style={styles.heroJumpTrailLeft} />
          <View style={styles.heroJumpTrailRight} />
          <View style={styles.heroRopiLayer}>
            <Image source={routineRopiJump} resizeMode="contain" style={styles.heroRopiImage} />
          </View>
        </View>
      </MotionReveal>

      <MotionReveal delay={90} distance={5} style={styles.segmentPanel}>
        <View
          onLayout={({ nativeEvent }) => {
            const nextWidth = nativeEvent.layout.width;
            setSegmentWidth((currentWidth) => Math.abs(currentWidth - nextWidth) > 0.5 ? nextWidth : currentWidth);
          }}
          style={styles.segmentTrack}
        >
          {segmentItemWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              testID="routine-tab-indicator"
              style={[
                styles.segmentIndicator,
                {
                  width: segmentItemWidth,
                  transform: [{ translateX: segmentIndicatorX }],
                },
              ]}
            />
          ) : null}
          {tabs.map((tab, index) => (
            <RoutineSegmentTab
              key={tab.name}
              onPress={() => selectRoutineTab(tab.name, index)}
              selected={activeTab === tab.name}
              tab={tab}
            />
          ))}
        </View>
      </MotionReveal>

      {activeTab === 'library' ? (
        <>
      <MotionReveal delay={140} distance={5}>
        <View style={styles.sectionHeader}>
          <AppText weight="800" style={styles.sectionTitle}>
            Rutinas recomendadas ✨
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver todas las rutinas" style={({ pressed }) => [{ opacity: pressed ? 0.62 : 1 }]}>
            <AppText weight="800" style={styles.sectionLink}>
              Ver todas 〉
            </AppText>
          </Pressable>
        </View>
      </MotionReveal>

      <View style={styles.recommendationGrid}>
        {recommendations.map((item, index) => (
          <MotionReveal key={item.routineId} delay={190 + index * 65} distance={7} fromScale={0.985} style={styles.gridReveal}>
            <RecommendationCard
              item={item}
              isFavorite={routines.find((routine) => routine.id === item.routineId)?.isFavorite ?? false}
              onToggleFavorite={() => toggleFavoriteRoutine(item.routineId)}
              onStart={() => navigate({ name: 'timer', routineId: item.routineId })}
              jumpCadenceSpm={jumpCadenceSpm}
              weightKg={weightKg}
            />
          </MotionReveal>
        ))}
      </View>

      <MotionReveal delay={380} distance={5} style={styles.categorySection}>
        <AppText weight="800" style={styles.sectionTitle}>
          Explorar por categoría
        </AppText>
        <View style={styles.categoryGrid}>
          {routineCategories.map((item, index) => (
            <MotionReveal key={item.id} delay={420 + index * 45} distance={5} fromScale={0.97} style={styles.gridReveal}>
              <CategoryTile
                item={item}
                onPress={() => navigate({ name: 'routineCategory', categoryId: item.id })}
              />
            </MotionReveal>
          ))}
        </View>
      </MotionReveal>

      <View style={styles.sectionHeader}>
        <AppText weight="800" style={styles.sectionTitle}>
          Mis rutinas
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear rutina"
          onPress={() => navigate({ name: 'routineEditor', editingNew: true })}
          style={({ pressed }) => [styles.createRoutineLink, { opacity: pressed ? 0.62 : 1 }]}
        >
          <AppText weight="800" style={styles.sectionLink}>
            Crear rutina
          </AppText>
          <View style={styles.createRoutinePlus}>
            <Plus size={10} color="#7657FF" strokeWidth={3} />
          </View>
        </Pressable>
      </View>

      <MotionReveal delay={610} distance={6}>
        <MyRoutineCard onPress={() => navigate({ name: 'routineEditor', editingNew: true })} />
      </MotionReveal>
        </>
      ) : activeTab === 'mine' ? (
        <RoutineTabPanel
          actionLabel="Crear rutina"
          emptyBody="Arma tu primera rutina personalizada con tus tiempos."
          emptyTitle="Todavia no creaste rutinas"
          icon="star"
          onAction={() => navigate({ name: 'routineEditor', editingNew: true })}
          onOpen={(routineId) => navigate({ name: 'routineDetail', routineId })}
          routines={customRoutines}
          title="Mis rutinas"
        />
      ) : (
        <RoutineTabPanel
          actionLabel="Explorar rutinas"
          emptyBody="Toca el corazon en una rutina para guardarla aca."
          emptyTitle="Todavia no hay favoritas"
          icon="heart"
          onAction={() => selectRoutineTab('library', 0)}
          onOpen={(routineId) => navigate({ name: 'routineDetail', routineId })}
          routines={favoriteRoutines}
          title="Favoritas"
        />
      )}
    </Screen>
  );
};

const RecommendationCard = ({
  isFavorite,
  item,
  jumpCadenceSpm,
  onStart,
  onToggleFavorite,
  weightKg,
}: {
  isFavorite: boolean;
  item: RecommendationCardData;
  jumpCadenceSpm?: number;
  onStart: () => void;
  onToggleFavorite: () => void;
  weightKg?: number;
}) => {
  const estimatedCalories = estimateCalories(item.minutes * 60, weightKg, item.intensity, jumpCadenceSpm);

  return (
    <View style={[styles.recommendationCard, { backgroundColor: item.background, borderColor: item.border }]}>
      <View style={styles.recommendationTopRow}>
        <View style={[styles.recommendationChip, { backgroundColor: item.chipBackground }]}>
          {item.chipIcon === 'flame' ? (
            <Flame size={8} color="#FF6A32" fill="#FF6A32" />
          ) : item.chipIcon === 'leaf' ? (
            <Leaf size={8} color="#2EC978" fill="#2EC978" />
          ) : (
            <Trophy size={8} color="#FF8A33" fill="#FFB15E" />
          )}
          <AppText weight="800" style={[styles.recommendationChipText, { color: item.accent }]} numberOfLines={1}>
            {item.chipText}
          </AppText>
        </View>
        <MotionPressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isFavorite }}
          accessibilityLabel={`${isFavorite ? 'Quitar' : 'Agregar'} ${item.title} ${isFavorite ? 'de' : 'a'} favoritas`}
          containerStyle={styles.recommendationFavoriteMotion}
          hitSlop={6}
          onPress={onToggleFavorite}
          pressedScale={0.82}
          testID={`favorite-${item.routineId}`}
          style={({ pressed }) => [
            styles.recommendationFavoriteButton,
            isFavorite ? { backgroundColor: `${item.accent}18` } : null,
            pressed ? styles.recommendationFavoritePressed : null,
          ]}
        >
          <Star
            size={13}
            color={item.accent}
            fill={isFavorite ? item.accent : 'transparent'}
            strokeWidth={2.3}
          />
        </MotionPressable>
      </View>

      <RoutineTimerBadge minutes={item.minutes} color={item.accent} />

      <AppText weight="800" style={styles.recommendationTitle} numberOfLines={1} adjustsFontSizeToFit>
        {item.title}
      </AppText>
      <AppText weight="700" style={styles.recommendationDuration}>
        {item.minutes} min
      </AppText>

      <View style={styles.recommendationMetaRow}>
        <View style={styles.recommendationMetaItem}>
          <Flame size={9} color="#FF6A32" fill="#FF6A32" />
          <AppText weight="700" style={styles.recommendationMetaText} numberOfLines={1} adjustsFontSizeToFit>
            ~{estimatedCalories} kcal
          </AppText>
        </View>
        <View style={styles.recommendationMetaItem}>
          <BarChart3 size={9} color={item.difficultyColor} strokeWidth={2.7} />
          <AppText
            weight="700"
            style={[styles.recommendationMetaText, { color: item.difficultyColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.difficulty}
          </AppText>
        </View>
      </View>

      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={`Comenzar ${item.title}`}
        containerStyle={styles.recommendationButtonMotion}
        onPress={onStart}
        pressedScale={0.965}
        style={({ pressed }) => [styles.recommendationButton, { backgroundColor: item.button, opacity: pressed ? 0.82 : 1 }]}
      >
        <AppText weight="800" style={styles.recommendationButtonText}>
          Comenzar
        </AppText>
      </MotionPressable>
    </View>
  );
};

const RoutineTimerBadge = ({ color, minutes }: { color: string; minutes: number }) => (
  <View style={styles.timerBadgeWrap}>
    <View style={[styles.timerBadgeHalo, { backgroundColor: `${color}12` }]} />
    <View style={[styles.timerBadgeRingOuter, { borderColor: `${color}30` }]}>
      <View style={[styles.timerBadgeRing, { borderColor: color }]}>
        <AppText weight="800" style={[styles.timerBadgeNumber, { color }]}>
          {minutes}
        </AppText>
        <AppText weight="800" style={[styles.timerBadgeUnit, { color }]}>
          min
        </AppText>
      </View>
    </View>
  </View>
);

const CategoryTile = ({ item, onPress }: { item: RoutineCategory; onPress: () => void }) => (
  <MotionPressable
    accessibilityRole="button"
    accessibilityLabel={`Ver categoria ${item.title}`}
    onPress={onPress}
    pressedScale={0.965}
    style={({ pressed }) => [
      styles.categoryTile,
      {
        backgroundColor: item.background,
        opacity: pressed ? 0.78 : 1,
      },
    ]}
  >
    <View
      style={[
        styles.categoryIconBubble,
        {
          backgroundColor: `${item.accent}14`,
          borderColor: `${item.accent}1F`,
        },
      ]}
    >
      {item.icon === 'clock' ? (
        <Clock3 size={19} color={item.accent} strokeWidth={2.9} />
      ) : item.icon === 'flame' ? (
        <Flame size={19} color={item.accent} fill={item.accent} />
      ) : item.icon === 'dumbbell' ? (
        <Dumbbell size={19} color={item.accent} strokeWidth={2.9} />
      ) : item.icon === 'trophy' ? (
        <Trophy size={19} color={item.accent} fill="#FFB15E" strokeWidth={2.5} />
      ) : (
        <Heart size={19} color={item.accent} fill={item.accent} />
      )}
    </View>
    <AppText
      weight="800"
      style={[styles.categoryTitle, { color: item.accent }]}
      numberOfLines={item.id === 'strengthCardio' ? 2 : 1}
      adjustsFontSizeToFit
    >
      {item.title}
    </AppText>
    <AppText weight="700" style={styles.categoryRange} numberOfLines={1} adjustsFontSizeToFit>
      {item.range}
    </AppText>
  </MotionPressable>
);

const MyRoutineCard = ({ onPress }: { onPress: () => void }) => (
  <MotionPressable accessibilityRole="button" accessibilityLabel="Crear rutina personalizada" onPress={onPress} pressedScale={0.98} style={({ pressed }) => [styles.myRoutineCard, { opacity: pressed ? 0.86 : 1 }]}>
    <View style={styles.myRoutinePlusBlock}>
      <Plus size={33} color="#FFFFFF" strokeWidth={2.8} />
    </View>
    <View style={styles.myRoutineCopy}>
      <AppText weight="800" style={styles.myRoutineTitle}>
        Rutina personalizada
      </AppText>
      <AppText weight="700" style={styles.myRoutineMeta}>
        0 min · 0 saltos
      </AppText>
      <AppText weight="700" style={styles.myRoutineOwner}>
        Creada por vos
      </AppText>
    </View>
    <MoreHorizontal size={20} color="#7B7392" strokeWidth={2.8} />
  </MotionPressable>
);

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'flex-start',
    gap: 10,
    paddingTop: spacing.xl,
  },
  heroPanel: {
    minHeight: 150,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7454F6',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    shadowColor: '#6B4AFF',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroBackgroundImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.98,
    ...({
      WebkitMaskImage:
        'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 24%, rgba(0,0,0,0.58) 52%, #000 74%, #000 100%)',
      WebkitMaskSize: '100% 100%',
      maskImage:
        'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.1) 24%, rgba(0,0,0,0.58) 52%, #000 74%, #000 100%)',
      maskSize: '100% 100%',
    } as any),
  },
  heroImageTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(110, 76, 245, 0.14)',
    zIndex: 1,
  },
  heroContent: {
    width: '48%',
    minWidth: 146,
    zIndex: 5,
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    textShadowColor: 'rgba(50, 34, 129, 0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  streakChip: {
    minHeight: 20,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    backgroundColor: 'rgba(66, 43, 179, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  streakChipText: {
    color: '#FFFFFF',
    fontSize: 8.2,
    lineHeight: 10,
  },
  progressButton: {
    minHeight: 31,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2C1F79',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  progressButtonText: {
    color: '#211B34',
    fontSize: 11,
    lineHeight: 14,
  },
  heroReservedArea: {
    flex: 1,
    alignSelf: 'stretch',
    position: 'relative',
    zIndex: 4,
  },
  heroRopiAuraOuter: {
    position: 'absolute',
    right: 3,
    top: 22,
    width: 124,
    height: 100,
    borderRadius: 999,
    backgroundColor: 'rgba(64, 42, 145, 0.14)',
    zIndex: 1,
  },
  heroRopiAuraInner: {
    position: 'absolute',
    right: 20,
    top: 37,
    width: 90,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    zIndex: 2,
  },
  heroRopiShadowSoft: {
    position: 'absolute',
    right: 18,
    bottom: 2,
    width: 110,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(54, 36, 116, 0.12)',
    opacity: 0.85,
    filter: 'blur(10px)',
    zIndex: 3,
  },
  heroRopiShadow: {
    position: 'absolute',
    right: 27,
    bottom: 6,
    width: 88,
    height: 15,
    borderRadius: 999,
    backgroundColor: 'rgba(54, 36, 116, 0.28)',
    opacity: 0.76,
    filter: 'blur(5px)',
    zIndex: 4,
  },
  heroJumpTrailLeft: {
    position: 'absolute',
    right: 98,
    bottom: 25,
    width: 3,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.56)',
    transform: [{ rotate: '-24deg' }],
    zIndex: 6,
  },
  heroJumpTrailRight: {
    position: 'absolute',
    right: 25,
    bottom: 28,
    width: 3,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    transform: [{ rotate: '24deg' }],
    zIndex: 6,
  },
  heroRopiLayer: {
    position: 'absolute',
    right: 9,
    bottom: 1,
    width: 114,
    height: 126,
    zIndex: 8,
  },
  heroRopiImage: {
    width: '100%',
    height: '100%',
  },
  segmentPanel: {
    minHeight: 46,
    borderRadius: 15,
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DFF7',
    shadowColor: '#7B56F8',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  segmentTrack: {
    position: 'relative',
    width: '100%',
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SEGMENT_GAP,
  },
  segmentIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
    borderRadius: 12,
    backgroundColor: '#F1EAFE',
    borderWidth: 1,
    borderColor: '#E0D4FF',
    shadowColor: '#7657FF',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  segmentItemMotion: {
    flex: 1,
    minWidth: 0,
    zIndex: 1,
  },
  segmentItem: {
    width: '100%',
    minHeight: 36,
    borderRadius: 12,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  segmentItemContent: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentItemPressed: {
    opacity: 0.76,
  },
  segmentImage: {
    width: 18,
    height: 18,
    opacity: 0.58,
  },
  segmentImageSelected: {
    opacity: 1,
  },
  segmentText: {
    color: '#777189',
    fontSize: 10,
    lineHeight: 13,
  },
  segmentTextSelected: {
    color: '#6B4EFF',
  },
  sectionHeader: {
    minHeight: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#201B33',
    fontSize: 12,
    lineHeight: 15,
  },
  sectionLink: {
    color: '#7657FF',
    fontSize: 8.5,
    lineHeight: 11,
  },
  tabPanel: {
    gap: 9,
  },
  tabRoutineList: {
    gap: 8,
  },
  tabRoutineCard: {
    minHeight: 68,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.055,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  tabRoutineIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFFF',
  },
  tabRoutineCopy: {
    flex: 1,
    minWidth: 0,
  },
  tabRoutineTitle: {
    color: '#211D33',
    fontSize: 12.5,
    lineHeight: 16,
  },
  tabRoutineMeta: {
    color: '#817991',
    fontSize: 9.4,
    lineHeight: 12,
    marginTop: 2,
  },
  tabRoutineArrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE7F8',
    shadowColor: '#7B56F8',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  emptyTabCard: {
    minHeight: 108,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5F8',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 12,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.055,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emptyTabIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFFF',
  },
  emptyTabCopy: {
    flex: 1,
    minWidth: 0,
  },
  emptyTabTitle: {
    color: '#211D33',
    fontSize: 13.5,
    lineHeight: 17,
  },
  emptyTabBody: {
    color: '#766F88',
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 3,
  },
  recommendationGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  gridReveal: {
    flex: 1,
    minWidth: 0,
  },
  recommendationCard: {
    flex: 1,
    minWidth: 0,
    height: 177,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 8,
    alignItems: 'center',
    shadowColor: '#8D70F8',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  recommendationTopRow: {
    width: '100%',
    minHeight: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  recommendationChip: {
    height: 16,
    maxWidth: 72,
    borderRadius: 999,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recommendationChipText: {
    fontSize: 6.7,
    lineHeight: 9,
  },
  recommendationFavoriteMotion: {
    width: 18,
    height: 18,
  },
  recommendationFavoriteButton: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationFavoritePressed: {
    opacity: 0.72,
  },
  timerBadgeWrap: {
    width: 68,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  timerBadgeHalo: {
    position: 'absolute',
    width: 60,
    height: 52,
    borderRadius: 999,
  },
  timerBadgeRingOuter: {
    width: 54,
    height: 54,
    borderRadius: 999,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadgeRing: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadgeNumber: {
    fontSize: 20,
    lineHeight: 21,
    marginTop: 1,
  },
  timerBadgeUnit: {
    fontSize: 7.4,
    lineHeight: 8,
    marginTop: -2,
  },
  recommendationTitle: {
    color: '#211D33',
    fontSize: 11,
    lineHeight: 14,
    marginTop: -1,
    textAlign: 'center',
  },
  recommendationDuration: {
    color: '#5D586F',
    fontSize: 8.2,
    lineHeight: 10,
    marginTop: 1,
  },
  recommendationMetaRow: {
    width: '100%',
    minHeight: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 3,
    marginTop: 7,
  },
  recommendationMetaItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  recommendationMetaText: {
    flex: 1,
    minWidth: 0,
    color: '#5F5872',
    fontSize: 6.5,
    lineHeight: 8,
  },
  recommendationButton: {
    width: '100%',
    height: 27,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
    shadowColor: '#6F5BFF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  recommendationButtonMotion: {
    width: '100%',
  },
  recommendationButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 12,
  },
  categorySection: {
    gap: 8,
    marginTop: 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 7,
  },
  categoryTile: {
    flex: 1,
    minWidth: 0,
    height: 86,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingTop: 8,
    paddingBottom: 7,
    borderWidth: 1,
    borderColor: 'rgba(122, 87, 255, 0.07)',
    shadowColor: '#7557F6',
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  categoryIconBubble: {
    width: 38,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
  },
  categoryTitle: {
    minHeight: 20,
    fontSize: 8.7,
    lineHeight: 10,
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  categoryRange: {
    color: '#7F788D',
    fontSize: 7.1,
    lineHeight: 9,
    marginTop: 1,
    textAlign: 'center',
  },
  createRoutineLink: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  createRoutinePlus: {
    width: 14,
    height: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1EAFE',
  },
  myRoutineCard: {
    minHeight: 74,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5F8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 12,
    shadowColor: '#7B56F8',
    shadowOpacity: 0.06,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  myRoutinePlusBlock: {
    width: 56,
    height: 56,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7A55FF',
    ...({
      backgroundImage: 'linear-gradient(180deg, #8E6BFF 0%, #704CFF 100%)',
    } as any),
  },
  myRoutineCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  myRoutineTitle: {
    color: '#211D33',
    fontSize: 12,
    lineHeight: 15,
  },
  myRoutineMeta: {
    color: '#7657FF',
    fontSize: 9,
    lineHeight: 11,
  },
  myRoutineOwner: {
    color: '#8C879B',
    fontSize: 8.4,
    lineHeight: 11,
  },
});
