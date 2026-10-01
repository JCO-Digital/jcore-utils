import { getHTMLElements, getNumericDataValue, debounce } from "./helpers";
import { ScrollItem, ScrollPos, StickyItem } from "./types";

const jcoreSticky: StickyItem[] = [];
const jcoreScroll: ScrollItem[] = [];
const jcoreScrollPos: ScrollPos = {
  current: 0,
  last: 0,
  up: null,
  down: null,
};

/*
 * Layout is only read where it is up to date, and written once per frame.
 *
 * Reading a position or a size (`scrollTop`, `offsetTop`, `clientHeight`)
 * after a class or a style has changed makes the browser lay the page out
 * there and then, just to answer: a forced reflow. Handling every scroll
 * event on the spot did exactly that. Each one read the scroll position and
 * the elements' heights and then rewrote their classes and `--jutils-height`,
 * so the next event's read had to lay the page out again.
 *
 * Instead, scroll and resize events only ask for a frame. In it, everything
 * is read first, and only what has changed is written after. Sizes are
 * measured when they can change - on the first layout, when an observed
 * element resizes and when the window does - rather than on every scroll.
 * The ResizeObserver hands them over after layout, when reading is free.
 */
let frame = 0;
let measureNeeded = true;
let positioned = false;
let listening = false;

export function scrollInit() {
  getSticky();
  getScroll();

  if (listening || (!jcoreSticky.length && !jcoreScroll.length)) {
    return;
  }
  listening = true;

  window.addEventListener("scroll", () => requestUpdate(), { passive: true });
  window.addEventListener(
    "resize",
    debounce(() => requestUpdate(true), 50),
  );

  if ("ResizeObserver" in window) {
    // Fires for every element once it has first been laid out, which also
    // makes the first update.
    const observer = new ResizeObserver(update);
    jcoreSticky.forEach((sticky) => observer.observe(sticky.element));
    jcoreScroll.forEach((scroll) => observer.observe(scroll.element));
  } else {
    requestUpdate(true);
  }
}

function getSticky() {
  getHTMLElements("[data-jsticky='true']").forEach((sticky, i) => {
    if (!sticky.parentNode) {
      return;
    }
    const spacer = document.createElement("div");
    spacer.id = "spacer_" + i;
    sticky.parentNode.insertBefore(spacer, sticky);
    jcoreSticky.push({
      element: sticky,
      spacer: spacer,
      showSpacer: sticky.dataset.jstickyNoSpacer === undefined,
      posY: 0,
      posX: 0,
      height: 0,
      width: 0,
      active: false,
      spacerHeight: null,
    });
  });
  console.debug("jcoreSticky elements found: ", jcoreSticky.length);
}

function getScroll() {
  getHTMLElements("[data-jscroll='true']").forEach((scroll) => {
    scroll.classList.add("scrollActive");
    const threshold = getNumericDataValue(scroll.dataset.threshold, 75);
    const scrollStart = getNumericDataValue(
      scroll.dataset.scrollstart,
      threshold,
    );
    scroll.classList.add("jcoreLoading");
    jcoreScroll.push({
      element: scroll,
      threshold: threshold,
      scrollStart: scrollStart,
      loading: true,
      height: 0,
      renderedHeight: null,
      state: { scrollTop: null, scrollUp: null, scrollDown: null },
    });
  });
  console.debug("jcoreScroll elements found: ", jcoreScroll.length);
}

/**
 * Asks for an update in the next frame. All the events in one frame share it.
 *
 * @param remeasure Whether sizes and positions may have changed as well.
 */
function requestUpdate(remeasure = false) {
  measureNeeded = measureNeeded || remeasure;
  if (!frame) {
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (measureNeeded) {
        update();
      } else {
        readScroll();
        checkStickyPos();
        checkScrollPos();
      }
    });
  }
}

// A full update: measure everything, then write.
function update() {
  measure();
  jcoreSticky.forEach(setSpacerHeight);
  checkStickyPos();
  checkScrollPos();
}

// Reads everything that needs layout, before anything is written.
function measure() {
  measureNeeded = false;
  jcoreSticky.forEach((sticky) => {
    const pos = getPos(sticky.spacer);
    sticky.posY = pos.y;
    sticky.posX = pos.x;
    sticky.height = sticky.element.offsetHeight;
    sticky.width = sticky.element.offsetWidth;
  });
  jcoreScroll.forEach((scroll) => {
    scroll.height = scroll.element.clientHeight;
  });
  readScroll();
}

function readScroll() {
  // The first reading is where the page starts, not a scroll.
  if (!positioned) {
    positioned = true;
    jcoreScrollPos.current = jcoreScrollPos.last = getScrollPosition();
    return;
  }
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
}

function checkStickyPos() {
  jcoreSticky.forEach((sticky) => {
    if (jcoreScrollPos.current >= sticky.posY && !sticky.active) {
      activateSticky(sticky, true);
    } else if (jcoreScrollPos.current < sticky.posY && sticky.active) {
      activateSticky(sticky, false);
    }
  });
}

// Writes only what differs from what is already on the element.
function checkScrollPos() {
  jcoreScroll.forEach((scroll) => {
    if (scroll.renderedHeight !== scroll.height) {
      scroll.renderedHeight = scroll.height;
      scroll.element.style.setProperty("--jutils-height", scroll.height + "px");
    }
    setScrollClass(
      scroll,
      "scrollTop",
      jcoreScrollPos.current < scroll.scrollStart,
    );
    if (
      jcoreScrollPos.up !== null &&
      jcoreScrollPos.up - jcoreScrollPos.current > scroll.threshold
    ) {
      setScrollClass(scroll, "scrollUp", true);
      setScrollClass(scroll, "scrollDown", false);
    }
    if (
      jcoreScrollPos.down !== null &&
      jcoreScrollPos.current - jcoreScrollPos.down > scroll.threshold
    ) {
      setScrollClass(scroll, "scrollDown", true);
      setScrollClass(scroll, "scrollUp", false);
    }
    if (scroll.loading) {
      setTimeout(() => {
        scroll.element.classList.remove("jcoreLoading");
      }, 100);
      scroll.loading = false;
    }
  });
}

function setScrollClass(
  scroll: ScrollItem,
  name: keyof ScrollItem["state"],
  on: boolean,
) {
  if (scroll.state[name] !== on) {
    scroll.state[name] = on;
    scroll.element.classList.toggle(name, on);
  }
}

// Read the position of elements.
function getPos(el) {
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
}

// Activate / Deactivate Stickiness
function activateSticky(sticky: StickyItem, activate = true) {
  sticky.active = activate;
  if (activate) {
    setSpacerHeight(sticky);
    sticky.element.classList.remove("hidden");
    sticky.element.classList.add("sticky");
  } else {
    sticky.spacerHeight = "0";
    sticky.spacer.style.height = "0";
    sticky.element.classList.add("hidden");
    sticky.element.classList.remove("sticky");
  }
}

function getScrollPosition() {
  const bodyTop = document.body.scrollTop;
  const elementTop = document.documentElement.scrollTop;
  if (bodyTop > elementTop) return bodyTop;
  return elementTop;
}

function setSpacerHeight(sticky: StickyItem) {
  const height = sticky.showSpacer ? sticky.height + "px" : "";
  if (sticky.spacerHeight !== height) {
    sticky.spacerHeight = height;
    sticky.spacer.style.height = height;
  }
}
