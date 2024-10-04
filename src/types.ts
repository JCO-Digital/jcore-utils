export interface StickyItem {
  element: HTMLElement;
  spacer: HTMLElement;
  showSpacer: boolean;
  posY: number;
  posX: number;
  height: number;
  width: number;
  active: boolean;
}

export interface ScrollItem {
  element: HTMLElement;
  threshold: number;
  scrollStart: number;
  loading: boolean;
}

export interface ToggleSource {
  element: HTMLElement;
  timeout: number;
}

export interface ToggleTarget {
  element: HTMLElement;
  targetClass: string;
  click: ToggleSource[];
  hover: ToggleSource[];
  focus: ToggleSource[];
  openTimer: number;
  closeTimer: number;
  timeout: number;
  group: string[];
}

export interface ScrollPos {
  current: number;
  last: number;
  up: number | null;
  down: number | null;
}
