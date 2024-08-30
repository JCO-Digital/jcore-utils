const jcoreSticky = [];
const jcoreScroll = [];
const jcoreToggle = [];
const jcoreFocus = [];
const jcoreScrollPos = {
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
  searchBar();
};
const searchBar = () => {
  // Searchbar
  // This adds a click event to any button with the class toggle-search

  const searchButtons = document.getElementsByClassName("toggle-search");
  if (searchButtons) {
    function searchToggle() {
      document.getElementById("menu-searchbar").classList.toggle("hidden");
    }

    function searchbarStatus() {
      this.classList.toggle("searchbar-open");
    }

    for (let i = 0; i < searchButtons.length; i++) {
      searchButtons[i].addEventListener("click", searchToggle, false);
      searchButtons[i].addEventListener("click", searchbarStatus, false);
    }
  }

  // End of searchbar code
};

const getSticky = () => {
  document
    .querySelectorAll("[data-jsticky]")
    .forEach((sticky: HTMLElement, i) => {
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
  document
    .querySelectorAll("[data-jscroll='true']")
    .forEach((scroll: HTMLElement) => {
      scroll.classList.add("scrollActive");
      scroll.style.setProperty("--jutils-height", scroll.clientHeight + "px");
      const threshold = scroll.dataset.threshold
        ? scroll.dataset.threshold
        : 75;
      const scrollStart = scroll.dataset.scrollstart
        ? scroll.dataset.scrollstart
        : threshold;
      addClass(scroll, "jcoreLoading");
      jcoreScroll.push({
        element: scroll,
        threshold: threshold,
        scrollStart: scrollStart,
        loading: true,
      });
    });
};
const getToggle = () => {
  document.querySelectorAll("[data-jtoggle]").forEach((toggle: HTMLElement) => {
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
    const toggleItem = {
      element: toggle,
      targets,
      targetClass,
      timeout,
      group,
    };
    jcoreToggle.push(toggleItem);
    updateClass(toggle, targets, targetClass, hasClass(toggle, targetClass));
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
  document
    .querySelectorAll("[data-jtrigger]")
    .forEach((trigger: HTMLElement) => {
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
  document.querySelectorAll("[data-jfocus]").forEach((element: HTMLElement) => {
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
        addClass(focus.target, "focus");
        focus.active = true;
      });
      source.addEventListener("blur", () => {
        focus.active = false;
        focus.timeout = setTimeout(() => {
          if (!focus.active) {
            removeClass(focus.target, "focus");
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
    if (jcoreScrollPos.current < scroll.scrollStart) {
      addClass(scroll.element, "scrollTop");
    } else {
      removeClass(scroll.element, "scrollTop");
    }
    if (
      jcoreScrollPos.up !== null &&
      jcoreScrollPos.up - jcoreScrollPos.current > scroll.threshold
    ) {
      addClass(scroll.element, "scrollUp");
      removeClass(scroll.element, "scrollDown");
    }
    if (
      jcoreScrollPos.down !== null &&
      jcoreScrollPos.current - jcoreScrollPos.down > scroll.threshold
    ) {
      addClass(scroll.element, "scrollDown");
      removeClass(scroll.element, "scrollUp");
    }
    if (scroll.loading) {
      setTimeout(() => {
        removeClass(scroll.element, "jcoreLoading");
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
const toggleHandler = (toggleItem, forcedState = undefined) => {
  const activate =
    forcedState === undefined
      ? !hasClass(toggleItem.element, toggleItem.targetClass)
      : forcedState;
  if (activate && toggleItem.group) {
    // If item has a group set, look for all other group elements.
    jcoreToggle.forEach((item) => {
      if (
        item.group === toggleItem.group &&
        hasClass(item.element, item.targetClass)
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
  addClass(element, targetClass);
  if (timeout) {
    addClass(element, "activate");
    setTimeout(() => {
      removeClass(element, "activate");
    }, timeout);
  }
};
const deactivate = (element, targetClass, timeout = null) => {
  removeClass(element, targetClass);
  if (timeout) {
    addClass(element, "deactivate");
    setTimeout(() => {
      removeClass(element, "deactivate");
    }, timeout);
  }
};

// Activate / Deactivate Stickiness
const activateSticky = (sticky, activate = true) => {
  sticky.active = activate;
  if (activate) {
    sticky.spacer.style.height = sticky.showSpacer ? sticky.height + "px" : "";
    addClass(sticky.element, "sticky");
  } else {
    sticky.spacer.style.height = "";
    removeClass(sticky.element, "sticky");
  }
};
// Add class to an element
const addClass = (element, className) => {
  const classes = element.className ? element.className.split(" ") : [];
  if (classes.indexOf(className) === -1) {
    classes.push(className);
    element.className = classes.join(" ");
  }
};
// Remove class to element
const removeClass = (element, className) => {
  const classes = element.className ? element.className.split(" ") : [];
  const index = classes.indexOf(className);
  if (index !== -1) {
    classes.splice(index, 1);
    element.className = classes.join(" ");
  }
};
// Check if an element has a class
const hasClass = (element, className) => {
  const classes = element.className ? element.className.split(" ") : [];
  return classes.indexOf(className) !== -1;
};

const getScrollPosition = () => {
  const bodyTop = document.body.scrollTop;
  const elementTop = document.documentElement.scrollTop;
  if (bodyTop > elementTop) return bodyTop;
  return elementTop;
};

export function debounce(func: Function, timeout = 300) {
  let timer: number;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

window.addEventListener("resize", onResize);
window.addEventListener("scroll", onScroll);
window.addEventListener("load", menuInit);
