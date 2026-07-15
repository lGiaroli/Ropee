export type ScreenName =
  | 'home'
  | 'routines'
  | 'routineCategory'
  | 'routineDetail'
  | 'routineEditor'
  | 'timer'
  | 'summary'
  | 'history'
  | 'stats'
  | 'missions'
  | 'achievements'
  | 'settings'
  | 'profile';

export interface RouteState {
  name: ScreenName;
  categoryId?: string;
  routineId?: string;
  editingNew?: boolean;
}

export interface NavigationProps {
  route: RouteState;
  navigate: (route: RouteState) => void;
}

const rootScreens = new Set<ScreenName>(['home', 'routines', 'stats', 'profile']);
const homeRoute: RouteState = { name: 'home' };

const sameRoute = (left: RouteState, right: RouteState) =>
  left.name === right.name &&
  left.categoryId === right.categoryId &&
  left.routineId === right.routineId &&
  left.editingNew === right.editingNew;

export const pushRoute = (stack: RouteState[], nextRoute: RouteState): RouteState[] => {
  const currentRoute = stack.at(-1);
  if (currentRoute && sameRoute(currentRoute, nextRoute)) return stack;

  if (rootScreens.has(nextRoute.name)) {
    return nextRoute.name === 'home' ? [nextRoute] : [homeRoute, nextRoute];
  }

  if (nextRoute.name === 'summary' && currentRoute?.name === 'timer') {
    return [...stack.slice(0, -1), nextRoute];
  }

  return [...stack, nextRoute].slice(-24);
};

export const popRoute = (stack: RouteState[]): RouteState[] =>
  stack.length > 1 ? stack.slice(0, -1) : stack;
