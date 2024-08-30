interface StickyItem {
  element: HTMLElement;
  spacer: HTMLElement;
  showSpacer: boolean;
  posY: number;
  posX: number;
  height: number;
  width: number;
  active: boolean;
}

interface ScrollItem {
  element: HTMLElement;
  threshold: number;
  scrollStart: number;
  loading: boolean;
}

interface ToggleSource {
  element: HTMLElement;
  targetClass: string;
}

interface ToggleTarget {
  element: HTMLElement;
  active: boolean;
  click: ToggleSource[];
  hover: ToggleSource[];
  focus: ToggleSource[];
  timeout: ReturnType<typeof setTimeout>;
  group: string[];
}

interface ScrollPos {
  current: number;
  last: number;
  up: number | null;
  down: number | null;
}

const jcoreSticky: StickyItem[] = [];
const jcoreScroll: ScrollItem[] = [];
const jcoreToggle: ToggleTarget[] = [];
const jcoreScrollPos: ScrollPos = {
  current: 0,
  last: 0,
  up: null,
  down: null,
};

// Initialize Menu Elements
const menuInit = () => {
  jcoreScrollPos.current = document.documentElement.scrollTop;
  getSticky();
  getScroll();
  getToggle();
  getTrigger();
  onResize();
};

const getSticky = () => {
  getHTMLElements("[data-jsticky]").forEach((sticky, i) => {
    if (!sticky.parentNode) {
      return;
    }
    const spacer = document.createElement("div");
    spacer.id = "spacer_" + i;
    sticky.parentNode.insertBefore(spacer, sticky);
    console.debug(sticky.dataset);
    jcoreSticky.push({
      element: sticky,
      spacer: spacer,
      showSpacer: sticky.dataset.jstickyNoSpacer === undefined,
      posY: 0,
      posX: 0,
      height: 0,
      width: 0,
      active: false,
    });
  });
};
const getScroll = () => {
  getHTMLElements("[data-jscroll]").forEach((scroll) => {
    scroll.classList.add("scrollActive");
    const threshold = getNumericDataValue(scroll.dataset.threshold, 75);
    const scrollStart = getNumericDataValue(
      scroll.dataset.scrollstart,
      threshold
    );
    scroll.classList.add("jcoreLoading");
    jcoreScroll.push({
      element: scroll,
      threshold: threshold,
      scrollStart: scrollStart,
      loading: true,
    });
  });
};
const getToggle = () => {
  getHTMLElements("[data-jtoggle]").forEach((toggle) => {
    const targetClass = toggle.dataset.class ? toggle.dataset.class : "toggle";
    const timeout = getNumericDataValue(toggle.dataset.timeout, 200);
    const group = toggle.dataset.group;
    const targets = getHTMLTargets(toggle, "jtoggle");
    const source = {
      element: toggle,
      targetClass: targetClass,
    };

    targets.forEach((target) => {
      // Look for target in jcoreToggle.
      let found = false;
      // Create a empty target.
      let item: ToggleTarget = {
        element: target,
        active: false,
        click: [],
        hover: [],
        focus: [],
        timeout: 0,
        group: [],
      };
      jcoreToggle.forEach((t) => {
        if (target === t.element) {
          // Overwrite the empty target if found.
          item = t;
          found = true;
          return;
        }
      });

      let handler = false;
      if ("jhover" in toggle.dataset) {
        item.hover.push(source);
        handler = true;
      }
      if ("jfocus" in toggle.dataset) {
        item.focus.push(source);
        handler = true;
      }
      if (!handler) {
        // Only add click if focus or hover not set.
        item.click.push(source);
      }
      if (group && !item.group.includes(group)) {
        // Add group if defined, and not in list.
        item.group.push(group);
      }
      if (timeout > item.timeout) {
        // Set timeout if larger that old value.
        item.timeout = timeout;
      }

      if (!found) {
        // Target not found in list exist, add it.
        jcoreToggle.push(item);
      }
    });

    setToggleTargets();

    updateClass(
      toggle,
      targets,
      targetClass,
      toggle.classList.contains(targetClass)
    );
  });
};

function setToggleTargets() {
  jcoreToggle.forEach((target) => {
    // Set click handlers.
    target.click.forEach((source) => {
      source.element.addEventListener("click", () => {
        toggleHandler(target, source);
      });
    });
    // Set hover handlers.
    target.hover.forEach((source) => {
      source.element.addEventListener("mouseenter", () => {
        toggleHandler(target, source, true);
      });
      source.element.addEventListener("mouseleave", () => {
        toggleHandler(target, source, false);
      });
    });
    // Set focus handlers.
    target.focus.forEach((source) => {
      source.element.addEventListener("focus", () => {
        toggleHandler(target, source, true);
      });
      source.element.addEventListener("blur", () => {
        toggleHandler(target, source, false);
      });
    });
  });
}

const getTrigger = () => {
  getHTMLElements("[data-jtrigger]").forEach((trigger) => {
    const targets = getHTMLTargets(trigger, "jtrigger");
    trigger.addEventListener("click", () => {
      targets.forEach((target) => {
        target.click();
      });
    });
  });
};

// Check for stickiness in menus
const onScroll = () => {
  scrollHandler();
  checkStickyPos();
  checkScrollPos();
};

const scrollHandler = () => {
  jcoreScrollPos.last = jcoreScrollPos.current;
  jcoreScrollPos.current = getScrollPosition();
  if (jcoreScrollPos.current > jcoreScrollPos.last) {
    // Scrolling down
    jcoreScrollPos.up = null;
    if (jcoreScrollPos.down === null) {
      jcoreScrollPos.down = jcoreScrollPos.last;
    }
  } else if (jcoreScrollPos.current < jcoreScrollPos.last) {
    // Scrolling up
    jcoreScrollPos.down = null;
    if (jcoreScrollPos.up === null) {
      jcoreScrollPos.up = jcoreScrollPos.last;
    }
  }
};
// Update info about menu placement on resize
const onResize = () => {
  console.debug("Resize");
  jcoreSticky.forEach((sticky) => {
    const pos = getPos(sticky.spacer);
    sticky.posY = pos.y;
    sticky.posX = pos.x;
    sticky.height = sticky.element.offsetHeight;
    sticky.width = sticky.element.offsetWidth;
  });
  checkStickyPos();
  checkScrollPos();
};

const checkStickyPos = () => {
  // Check Sticky
  jcoreSticky.forEach((sticky) => {
    if (jcoreScrollPos.current >= sticky.posY && !sticky.active) {
      activateSticky(sticky, true);
    } else if (jcoreScrollPos.current < sticky.posY && sticky.active) {
      activateSticky(sticky, false);
    }
  });
};

const checkScrollPos = () => {
  // Check Scroll
  jcoreScroll.forEach((scroll) => {
    scroll.element.style.setProperty(
      "--jutils-height",
      scroll.element.clientHeight + "px"
    );
    if (jcoreScrollPos.current < scroll.scrollStart) {
      scroll.element.classList.add("scrollTop");
    } else {
      scroll.element.classList.remove("scrollTop");
    }
    if (
      jcoreScrollPos.up !== null &&
      jcoreScrollPos.up - jcoreScrollPos.current > scroll.threshold
    ) {
      scroll.element.classList.add("scrollUp");
      scroll.element.classList.remove("scrollDown");
    }
    if (
      jcoreScrollPos.down !== null &&
      jcoreScrollPos.current - jcoreScrollPos.down > scroll.threshold
    ) {
      scroll.element.classList.add("scrollDown");
      scroll.element.classList.remove("scrollUp");
    }
    if (scroll.loading) {
      setTimeout(() => {
        scroll.element.classList.remove("jcoreLoading");
      }, 100);
      scroll.loading = false;
    }
  });
};

// Read the position of elements.
const getPos = (el) => {
  let lx = 0;
  let ly = 0;
  while (el != null) {
    lx += el.offsetLeft;
    ly += el.offsetTop;
    el = el.offsetParent;
  }
  return {
    x: lx,
    y: ly,
  };
};

// Handle the toggle action
function toggleHandler(
  target: ToggleTarget,
  source: ToggleSource,
  forcedState: boolean | undefined = undefined
) {
  const activate =
    forcedState === undefined
      ? !target.element.classList.contains(source.targetClass)
      : forcedState;
  if (activate && target.group) {
    // If item has a group set, look for all other group elements.
    jcoreToggle.forEach((item) => {
      if (
        item.group === toggleItem.group &&
        item.element.classList.contains(item.targetClass)
      ) {
        // Deactivate all active group elements.
        updateClass(
          item.element,
          item.targets,
          item.targetClass,
          false,
          item.timeout
        );
      }
    });
  }
  updateClass(
    toggleItem.element,
    toggleItem.targets,
    toggleItem.targetClass,
    activate,
    toggleItem.timeout
  );
}

// Update the toggle class for all elements
const updateClass = (
  element: HTMLElement,
  targets: HTMLElement[],
  targetClass: string,
  active: boolean,
  timeout: number = 0
) => {
  element.setAttribute("aria-expanded", active ? "true" : "false");
  [element, ...targets].forEach((target) => {
    if (active) {
      activate(target, targetClass, timeout);
    } else {
      deactivate(target, targetClass, timeout);
    }
  });
};

const activate = (
  element: HTMLElement,
  targetClass: string,
  timeout: number
) => {
  element.classList.add(targetClass);
  if (timeout) {
    element.classList.add("activate");
    setTimeout(() => {
      element.classList.remove("activate");
    }, timeout);
  }
};
const deactivate = (
  element: HTMLElement,
  targetClass: string,
  timeout: number
) => {
  element.classList.remove(targetClass);
  if (timeout) {
    element.classList.add("deactivate");
    setTimeout(() => {
      element.classList.remove("deactivate");
    }, timeout);
  }
};

// Activate / Deactivate Stickiness
const activateSticky = (sticky, activate = true) => {
  sticky.active = activate;
  if (activate) {
    sticky.spacer.style.height = sticky.showSpacer ? sticky.height + "px" : "";
    sticky.element.classList.add("sticky");
  } else {
    sticky.spacer.style.height = "";
    sticky.element.classList.remove("sticky");
  }
};

const getScrollPosition = () => {
  const bodyTop = document.body.scrollTop;
  const elementTop = document.documentElement.scrollTop;
  if (bodyTop > elementTop) return bodyTop;
  return elementTop;
};

function getHTMLElements(identifier: string) {
  const returnList: Array<HTMLElement> = [];
  document.querySelectorAll(identifier).forEach((element) => {
    if (element instanceof HTMLElement) {
      returnList.push(element);
    }
  });
  return returnList;
}

function getHTMLTargets(element: HTMLElement, key: string) {
  const returnList: Array<HTMLElement> = [];
  const targets = element.dataset[key];
  if (targets === undefined) {
    return returnList;
  }
  targets.split(",").forEach((identifier) => {
    if (identifier === "parent") {
      const parent = element.parentElement;
      if (parent instanceof HTMLElement) {
        returnList.push(parent);
      }
    } else {
      returnList.concat(getHTMLElements(identifier));
    }
  });
  return returnList;
}

export function debounce(func: Function, timeout = 300) {
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

export function getNumericDataValue(
  value: string | undefined,
  defaultValue: number
): number {
  if (!value) {
    return defaultValue;
  }
  const numVal = parseInt(value);
  return Number.isInteger(numVal) ? numVal : defaultValue;
}

window.addEventListener(
  "resize",
  debounce(() => onResize(), 50)
);
window.addEventListener("scroll", onScroll);
window.addEventListener("load", menuInit);
