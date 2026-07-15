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
