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

interface ToggleItem {
  element: HTMLElement;
  targets: HTMLElement[];
  targetClass: string;
  timeout: number;
  group: string;
}

interface FocusItem {
  target: HTMLElement;
  source: HTMLElement[];
  active: boolean;
  timeout: ReturnType<typeof setTimeout> | null;
}

interface ScrollPos {
  current: number;
  last: number;
  up: number | null;
  down: number | null;
}

const jcoreSticky: StickyItem[] = [];
const jcoreScroll: ScrollItem[] = [];
const jcoreToggle: ToggleItem[] = [];
const jcoreFocus: FocusItem[] = [];
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
  getFocus();
  onResize();
};

const getSticky = () => {
  getHTMLElements("[data-jsticky]").forEach((sticky, i) => {
    if (sticky.dataset.jsticky !== "false") {
      const parentElement = sticky.parentNode;
      const spacer = document.createElement("div");
      spacer.id = "spacer_" + i;
      parentElement.insertBefore(spacer, sticky);
      jcoreSticky.push({
        element: sticky,
        spacer: spacer,
        showSpacer: sticky.dataset.jsticky !== "no-spacer",
        posY: 0,
        posX: 0,
        height: 0,
        width: 0,
        active: false,
      });
    }
  });
};
const getScroll = () => {
  getHTMLElements("[data-jscroll='true']").forEach((scroll) => {
    scroll.classList.add("scrollActive");
    const threshold = getDataValue(scroll.dataset.threshold, 75);
    const scrollStart = getDataValue(scroll.dataset.scrollstart, threshold);
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
    const timeout = toggle.dataset.timeout ? toggle.dataset.timeout : 200;
    const group = toggle.dataset.group ? toggle.dataset.group : null;
    const targets = toggle.dataset.jtoggle
      .split(" ")
      .map((t) => {
        return document.getElementById(t);
      })
      .filter((t) => {
        return t !== null;
      });
    const toggleItem: ToggleItem = {
      element: toggle,
      targets,
      targetClass,
      timeout,
      group,
    };
    jcoreToggle.push(toggleItem);
    updateClass(
      toggle,
      targets,
      targetClass,
      toggle.classList.contains(targetClass)
    );
    if ("jhover" in toggle.dataset) {
      toggle.addEventListener("mouseenter", () => {
        toggleHandler(toggleItem, true);
      });
      toggle.addEventListener("mouseleave", () => {
        if (toggle.getAttribute("aria-expanded") === "true")
          toggleHandler(toggleItem, false);
      });
    } else {
      toggle.addEventListener("click", () => {
        toggleHandler(toggleItem);
      });
    }
  });
};

const getTrigger = () => {
  getHTMLElements("[data-jtrigger]").forEach((trigger) => {
    const targets = trigger.dataset.jtrigger
      .split(" ")
      .map((t) => {
        return document.getElementById(t);
      })
      .filter((t) => {
        return t !== null;
      });
    trigger.addEventListener("click", () => {
      targets.forEach((target) => {
        target.click();
      });
    });
  });
};

const getFocus = () => {
  getHTMLElements("[data-jfocus]").forEach((element) => {
    element.dataset.jfocus.split(",").forEach((id) => {
      let target = null;
      if (id === "parent") {
        target = element.parentElement;
      } else {
        target = document.getElementById(id);
      }
      if (target !== null) {
        let found = false;
        jcoreFocus.forEach((t) => {
          if (t.target === target) {
            found = true;
            t.source.push(element);
          }
        });
        if (!found) {
          jcoreFocus.push({
            target,
            source: [element],
            active: false,
            timeout: null,
          });
        }
      }
    });
  });
  setFocus();
};

const setFocus = () => {
  jcoreFocus.forEach((focus) => {
    focus.source.forEach((source) => {
      source.addEventListener("focus", () => {
        focus.target.classList.add("focus");
        focus.active = true;
      });
      source.addEventListener("blur", () => {
        focus.active = false;
        focus.timeout = setTimeout(() => {
          if (!focus.active) {
            focus.target.classList.remove("focus");
          }
        }, 50);
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
const toggleHandler = (
  toggleItem,
  forcedState: boolean | undefined = undefined
) => {
  const activate =
    forcedState === undefined
      ? !toggleItem.element.classList.contains(toggleItem.targetClass)
      : forcedState;
  if (activate && toggleItem.group) {
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
};

// Update the toggle class for all elements
const updateClass = (element, targets, targetClass, active, timeout = null) => {
  element.setAttribute("aria-expanded", active ? "true" : "false");
  [element, ...targets].forEach((target) => {
    if (active) {
      activate(target, targetClass, timeout);
    } else {
      deactivate(target, targetClass, timeout);
    }
  });
};

const activate = (element, targetClass, timeout = null) => {
  element.classList.add(targetClass);
  if (timeout) {
    element.classList.add("activate");
    setTimeout(() => {
      element.classList.remove("activate");
    }, timeout);
  }
};
const deactivate = (element, targetClass, timeout = null) => {
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

export function debounce(func: Function, timeout = 300) {
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

export function getDataValue(
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
