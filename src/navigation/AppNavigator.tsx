import { Trophy } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, BackHandler, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { MotionReveal } from '@/components/MotionReveal';
import { useTheme } from '@/components/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AchievementsScreen } from '@/screens/AchievementsScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { MissionsScreen } from '@/screens/MissionsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RoutineCategoryScreen } from '@/screens/RoutineCategoryScreen';
import { RoutineDetailScreen } from '@/screens/RoutineDetailScreen';
import { RoutineEditorScreen } from '@/screens/RoutineEditorScreen';
import { RoutineLibraryScreen } from '@/screens/RoutineLibraryScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { SummaryScreen } from '@/screens/SummaryScreen';
import { TimerScreen } from '@/screens/TimerScreen';
import { popRoute, pushRoute, RouteState, ScreenName } from '@/navigation/navigation';
import { useAppStore } from '@/store/useAppStore';
import { radius, spacing } from '@/theme/tokens';

const tabIcons = {
  home: require('../../assets/icons/nav/tab-home.png'),
  routines: require('../../assets/icons/nav/tab-routines.png'),
  stats: require('../../assets/icons/nav/tab-progress.png'),
  profile: require('../../assets/icons/nav/tab-profile.png'),
};

const tabs: { name: ScreenName; label: string; icon: ImageSourcePropType }[] = [
  { name: 'home', label: 'Hoy', icon: tabIcons.home },
  { name: 'routines', label: 'Rutinas', icon: tabIcons.routines },
  { name: 'stats', label: 'Progreso', icon: tabIcons.stats },
  { name: 'profile', label: 'Perfil', icon: tabIcons.profile },
];

export const AppNavigator = () => {
  const hydrated = useAppStore((state) => state.hydrated);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const seedDemoUsage = useAppStore((state) => state.seedDemoUsage);
  const refreshStreak = useAppStore((state) => state.refreshStreak);
  const [routeStack, setRouteStack] = useState<RouteState[]>([{ name: 'home' }]);
  const route = routeStack.at(-1) ?? { name: 'home' };
  const demoSeeded = useRef(false);
  const { colors } = useTheme();
  const previewOnboarding =
    __DEV__ &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('onboarding') === 'preview';

  const navigate = useCallback((nextRoute: RouteState) => {
    setRouteStack((currentStack) => pushRoute(currentStack, nextRoute));
  }, []);

  const goBack = useCallback(() => {
    if (route.name === 'timer') return false;
    if (routeStack.length <= 1) return false;
    setRouteStack((currentStack) => popRoute(currentStack));
    return true;
  }, [route.name, routeStack.length]);

  useEffect(() => {
    if (!__DEV__ || !hydrated || demoSeeded.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') !== 'usage') return;

    demoSeeded.current = true;
    seedDemoUsage();
    window.history.replaceState(null, '', window.location.pathname);
    const routeTimer = window.setTimeout(() => navigate({ name: 'stats' }), 0);
    return () => window.clearTimeout(routeTimer);
  }, [hydrated, navigate, seedDemoUsage]);

  useEffect(() => {
    if (!hydrated) return undefined;
    refreshStreak();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshStreak();
    });
    return () => subscription.remove();
  }, [hydrated, refreshStreak]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  }, [goBack]);

  if (!hydrated) {
    return (
      <View style={[styles.shell, { backgroundColor: colors.surfaceStrong }]}>
        <View style={[styles.app, styles.loading, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MotionReveal distance={4} duration={360} fromScale={0.92} style={styles.loadingContent}>
            <Trophy size={36} color={colors.primary} />
            <AppText variant="title">Preparando Ropee...</AppText>
          </MotionReveal>
        </View>
      </View>
    );
  }

  if (!onboardingComplete || previewOnboarding) {
    return (
      <View style={[styles.shell, { backgroundColor: colors.surfaceStrong }]}>
        <View style={[styles.app, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <OnboardingScreen />
        </View>
      </View>
    );
  }

  const content = () => {
    switch (route.name) {
      case 'home':
        return <HomeScreen route={route} navigate={navigate} />;
      case 'routines':
        return <RoutineLibraryScreen route={route} navigate={navigate} />;
      case 'routineCategory':
        return <RoutineCategoryScreen route={route} navigate={navigate} />;
      case 'routineDetail':
        return <RoutineDetailScreen route={route} navigate={navigate} />;
      case 'routineEditor':
        return <RoutineEditorScreen route={route} navigate={navigate} />;
      case 'timer':
        return <TimerScreen route={route} navigate={navigate} />;
      case 'summary':
        return <SummaryScreen route={route} navigate={navigate} />;
      case 'history':
        return <HistoryScreen route={route} navigate={navigate} />;
      case 'stats':
        return <StatsScreen route={route} navigate={navigate} />;
      case 'missions':
        return <MissionsScreen route={route} navigate={navigate} />;
      case 'achievements':
        return <AchievementsScreen route={route} navigate={navigate} />;
      case 'settings':
        return <SettingsScreen route={route} navigate={navigate} />;
      case 'profile':
        return <ProfileScreen route={route} navigate={navigate} />;
      default:
        return <HomeScreen route={route} navigate={navigate} />;
    }
  };

  const showTabs = !['timer', 'summary', 'routineEditor'].includes(route.name);
  const routeKey = `${route.name}:${route.categoryId ?? ''}:${route.routineId ?? ''}:${route.editingNew ? 'new' : ''}`;

  return (
    <View style={[styles.shell, { backgroundColor: colors.surfaceStrong }]}>
      <View style={[styles.app, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <MotionReveal
          key={routeKey}
          triggerKey={routeKey}
          distance={5}
          duration={280}
          style={styles.routeContent}
        >
          {content()}
        </MotionReveal>
        {showTabs ? (
          <View style={[styles.tabs, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            {tabs.map((tab) => {
              const active = route.name === tab.name;
              return (
                <NavigationTab
                  key={tab.name}
                  active={active}
                  icon={tab.icon}
                  label={tab.label}
                  onPress={() => navigate({ name: tab.name })}
                />
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const NavigationTab = ({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
}) => {
  const reducedMotion = useReducedMotion();
  const [selection] = useState(() => new Animated.Value(active ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) {
      selection.setValue(active ? 1 : 0);
      return undefined;
    }
    const animation = Animated.spring(selection, {
      toValue: active ? 1 : 0,
      damping: 16,
      stiffness: 250,
      mass: 0.55,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [active, reducedMotion, selection]);

  const scale = selection.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });
  const opacity = selection.interpolate({ inputRange: [0, 1], outputRange: [0.52, 1] });
  const indicatorScale = selection.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.tabIndicator, { opacity: selection, transform: [{ scaleX: indicatorScale }] }]}
      />
      <Animated.Image
        source={icon}
        resizeMode="contain"
        style={[styles.tabIcon, { opacity, transform: [{ scale }] }]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignItems: 'center',
  },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    shadowColor: '#392A75',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingContent: {
    alignItems: 'center',
    gap: spacing.md,
  },
  routeContent: {
    flex: 1,
  },
  tabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 78,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: 6,
    paddingBottom: spacing.sm,
    justifyContent: 'space-between',
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  tab: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabPressed: {
    opacity: 0.78,
  },
  tabIndicator: {
    position: 'absolute',
    top: 1,
    width: 22,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: '#7657FF',
  },
  tabIcon: {
    width: 38,
    height: 38,
  },
});
