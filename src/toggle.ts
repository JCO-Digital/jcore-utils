import {
  getHTMLTargets,
  getHTMLElements,
  getNumericDataValue,
  isFocusable,
} from "./helpers";
import { EventType, ToggleSource, ToggleTarget } from "./types";

const jcoreToggle: ToggleTarget[] = [];

export function toggleInit() {
  getToggle();
  getTrigger();
}

export default function getToggle() {
  getHTMLElements("[data-jtoggle]").forEach((toggle) => {
    const targetClass = toggle.dataset.class ? toggle.dataset.class : "toggle";
    const timeout = getNumericDataValue(toggle.dataset.timeout, -1);
    const group = toggle.dataset.group;
    const targets = getHTMLTargets(toggle, "jtoggle");
    const source = {
      element: toggle,
      timeout: timeout,
    };

    targets.forEach((target) => {
      // Look for target in jcoreToggle.
      let found = false;
      // Create a empty target.
      let item: ToggleTarget = {
        element: target,
        targetClass: targetClass,
        type: EventType.None,
        click: [],
        hover: [],
        focus: [],
        closeTimer: 0,
        timeout: -1,
        group: [],
      };
      jcoreToggle.forEach((t) => {
        if (target === t.element && targetClass === t.targetClass) {
          // Overwrite the empty target if found.
          item = t;
          found = true;
          return;
        }
      });

      // Check for non matching timeouts.
      if (item.timeout > -1 && timeout != item.timeout) {
        console.warn(
          `Two different timeouts given. Both ${item.timeout} and ${timeout} for same target.`,
        );
      }

      // Use the biggest defined timeout.
      if (timeout > item.timeout) {
        item.timeout = timeout;
      }

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

      if (!found) {
        // Target not found in list exist, add it.
        jcoreToggle.push(item);
      }
    });
  });
  console.debug("jcoreToggle elements found: ", jcoreToggle.length);
  setToggleTargets();
}

function getTrigger() {
  getHTMLElements("[data-jtrigger]").forEach((trigger) => {
    const targets = getHTMLTargets(trigger, "jtrigger");
    trigger.addEventListener("click", () => {
      targets.forEach((target) => {
        target.click();
      });
    });
  });
}

function setToggleTargets() {
  jcoreToggle.forEach((target) => {
    if (target.timeout < 0) {
      target.timeout = 200;
    }
    let activated = target.element.classList.contains(target.targetClass);

    // Initilize element classes on load.
    updateElement(target, activated);

    /**
     * Set click handlers.
     */
    target.click.forEach((source) => {
      source.element.ariaExpanded = activated ? "true" : "false";
      if (target.element.id) {
        source.element.setAttribute("aria-controls", target.element.id);
      }
      source.element.addEventListener("mousedown", () => {
        activated = !target.element.classList.contains(target.targetClass);
      });
      source.element.addEventListener("click", () => {
        toggleHandler(target, EventType.Click, activated, source);
      });
    });

    /**
     * Set hover handlers.
     */
    target.hover.forEach((source) => {
      source.element.addEventListener("mouseenter", () => {
        timedOpen(target, EventType.Hover, source);
      });
      source.element.addEventListener("mouseleave", () => {
        timedClose(target, EventType.Hover, source);
      });
    });

    if (target.hover.length) {
      // Set hover handlers for target element if it has hover sources.
      target.element.addEventListener("mouseenter", () => {
        timedOpen(target, EventType.Hover);
      });
      target.element.addEventListener("mouseleave", () => {
        timedClose(target, EventType.Hover);
      });
    }

    /**
     * Set focus handlers.
     */
    target.focus.forEach((source) => {
      if (isFocusable(source.element)) {
        setFocusHandlers(source.element, target, source);
      }
    });
    if (target.focus.length) {
      // Set listeners to a
      target.element
        .querySelectorAll(
          'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
        )
        .forEach((element) => {
          if (element instanceof HTMLElement) {
            setFocusHandlers(element, target);
          }
        });
    }
  });
}

function setFocusHandlers(
  element: HTMLElement,
  target: ToggleTarget,
  source: ToggleSource | undefined = undefined,
) {
  let allowFocus = true;
  if (element.hasAttribute("href")) {
    element.addEventListener("mousedown", () => {
      // Stop focus handler from triggering on mouse click.
      allowFocus = false;
    });
  }
  element.addEventListener("focus", () => {
    if (allowFocus) {
      timedOpen(target, EventType.Focus, source);
    }
    allowFocus = true;
  });
  element.addEventListener("blur", () => {
    timedClose(target, EventType.Focus, source);
  });
}

function timedOpen(
  target: ToggleTarget,
  type: EventType,
  source: ToggleSource | undefined = undefined,
) {
  if (target.closeTimer) {
    clearTimeout(target.closeTimer);
    target.closeTimer = 0;
  }
  toggleHandler(target, type, true, source);
}
function timedClose(
  target: ToggleTarget,
  type: EventType,
  source: ToggleSource | undefined = undefined,
) {
  target.closeTimer = setTimeout(() => {
    toggleHandler(target, type, false, source);
  }, 50);
}

// Handle the toggle action
function toggleHandler(
  target: ToggleTarget,
  type: EventType,
  activate: boolean,
  source: ToggleSource | undefined = undefined,
) {
  if (source && source.element.ariaExpanded !== null) {
    source.element.ariaExpanded = activate ? "true" : "false";
  }

  if (type < target.type) {
    return;
  }

  if (activate && target.group) {
    // If item has a group set, look for all other group elements.
    jcoreToggle.forEach((item) => {
      if (arrayMatch(item.group, target.group)) {
        // Deactivate all active group elements.
        updateElement(item, false);
        item.type = EventType.None;
      }
    });
  }
  target.type = activate ? type : EventType.None;
  updateElement(target, activate);
}

function updateElement(target: ToggleTarget, activate: boolean) {
  const activeClass = activate ? "activate" : "deactivate";
  [target, ...target.click, ...target.focus, ...target.hover].forEach(
    (item) => {
      if (activate) {
        item.element.classList.add(target.targetClass);
      } else {
        item.element.classList.remove(target.targetClass);
      }
      if (target.timeout) {
        item.element.classList.add(activeClass);
        setTimeout(() => {
          item.element.classList.remove(activeClass);
        }, target.timeout);
      }
    },
  );
}

/**
 * Check if first and second arrays share one or more elements.
 *
 * @param first First array.
 * @param second Second array.
 */

function arrayMatch(first: string[], second: string[]) {
  for (const item of first) {
    if (second.includes(item)) {
      return true;
    }
  }
  return false;
}
