export interface StickyItem {
  element: HTMLElement;
  spacer: HTMLElement;
  showSpacer: boolean;
  posY: number;
  posX: number;
  height: number;
  width: number;
  active: boolean;
  /** The spacer height last written, so an unchanged one is not rewritten. */
  spacerHeight: string | null;
}

export interface ScrollItem {
  element: HTMLElement;
  threshold: number;
  scrollStart: number;
  loading: boolean;
  /** The element's last measured `clientHeight`. */
  height: number;
  /** The `--jutils-height` last written, in px. */
  renderedHeight: number | null;
  /** The scroll classes as last written; null until first set. */
  state: {
    scrollTop: boolean | null;
    scrollUp: boolean | null;
    scrollDown: boolean | null;
  };
}

export interface HeightItem {
  element: HTMLElement;
  target: HTMLElement[];
  name: string;
}

export interface ToggleSource {
  element: HTMLElement;
  timeout: number;
}

export interface ToggleTarget {
  element: HTMLElement;
  targetClass: string;
  type: EventType;
  click: ToggleSource[];
  hover: ToggleSource[];
  focus: ToggleSource[];
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

export enum EventType {
  None,
  Hover,
  Focus,
  Click,
}
