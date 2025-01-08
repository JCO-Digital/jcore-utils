import { debounce, getHTMLElements } from "./helpers";
import { HeightItem } from "./types";

const jcoreHeight: HeightItem[] = [];

export function heightInit() {
  getHeight();
  updateHeight();
}

window.addEventListener(
  "resize",
  debounce(() => updateHeight(), 50),
);

function getHeight() {
  let found = 0;
  getHTMLElements("[data-jheight]").forEach((element) => {
    if (!element.parentNode) {
      return;
    }
    const name = element.dataset.name ?? "jcore-height";
    let target = [element];
    if (element.dataset.jheight) {
      getHTMLElements(element.dataset.jheight).forEach((t) => {
        target.push(t);
      });
    }

    jcoreHeight.push({
      element,
      target,
      name,
    });
  });
  console.debug("jcoreHeight elements found: ", jcoreHeight.length);
}

function updateHeight() {
  for (const item of jcoreHeight) {
    const height = getElementHeight(item.element);
    for (const target of item.target) {
      target.style.setProperty(`--${item.name}`, `${height}px`);
    }
  }
}

function getElementHeight(element: HTMLElement) {
  let height = 0;
  for (const child of element.children) {
    if (child instanceof HTMLElement) {
      const styles = window.getComputedStyle(child);
      height +=
        child.offsetHeight +
        parseFloat(styles["marginTop"]) +
        parseFloat(styles["marginBottom"]);
    }
  }
  return height;
}
