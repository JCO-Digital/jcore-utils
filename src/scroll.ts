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

export function scrollInit() {
  jcoreScrollPos.current = document.documentElement.scrollTop;
  getSticky();
  getScroll();
  onResize();
}

function getSticky() {
  getHTMLElements("[data-jsticky]").forEach((sticky, i) => {
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
    });
  });
  console.debug("jcoreSticky elements found: ", jcoreSticky.length);
}

function getScroll() {
  getHTMLElements("[data-jscroll]").forEach((scroll) => {
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
    });
  });
  console.debug("jcoreScroll elements found: ", jcoreScroll.length);
}

function scrollHandler() {
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
  // Check Sticky
  jcoreSticky.forEach((sticky) => {
    if (jcoreScrollPos.current >= sticky.posY && !sticky.active) {
      activateSticky(sticky, true);
    } else if (jcoreScrollPos.current < sticky.posY && sticky.active) {
      activateSticky(sticky, false);
    }
  });
}

function checkScrollPos() {
  // Check Scroll
  jcoreScroll.forEach((scroll) => {
    scroll.element.style.setProperty(
      "--jutils-height",
      scroll.element.clientHeight + "px",
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
    sticky.spacer.style.display = "block";
    sticky.element.classList.add("sticky");
  } else {
    sticky.spacer.style.display = "none";
    sticky.element.classList.remove("sticky");
  }
}

function getScrollPosition() {
  const bodyTop = document.body.scrollTop;
  const elementTop = document.documentElement.scrollTop;
  if (bodyTop > elementTop) return bodyTop;
  return elementTop;
}

// Update info about menu placement on resize
function onResize() {
  jcoreSticky.forEach((sticky) => {
    const pos = getPos(sticky.spacer);
    sticky.posY = pos.y;
    sticky.posX = pos.x;
    sticky.height = sticky.element.offsetHeight;
    sticky.width = sticky.element.offsetWidth;
    setSpacerHeight(sticky);
  });
  checkStickyPos();
  checkScrollPos();
}

function setSpacerHeight(sticky: StickyItem) {
  sticky.spacer.style.height = sticky.showSpacer ? sticky.height + "px" : "";
}

// Check for stickiness in menus
function onScroll() {
  scrollHandler();
  checkStickyPos();
  checkScrollPos();
}

window.addEventListener(
  "resize",
  debounce(() => onResize(), 50),
);
window.addEventListener("scroll", onScroll);
