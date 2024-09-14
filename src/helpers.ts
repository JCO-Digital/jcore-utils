export function getHTMLElements(identifier: string) {
  const returnList: Array<HTMLElement> = [];
  document.querySelectorAll(identifier).forEach((element) => {
    if (element instanceof HTMLElement) {
      returnList.push(element);
    }
  });
  return returnList;
}

export function getHTMLTargets(element: HTMLElement, key: string) {
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
      getHTMLElements(identifier).forEach((item) => {
        returnList.push(item);
      });
    }
  });
  return returnList;
}

export function getNumericDataValue(
  value: string | undefined,
  defaultValue: number,
): number {
  if (!value) {
    return defaultValue;
  }
  const numVal = parseInt(value);
  return Number.isInteger(numVal) ? numVal : defaultValue;
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
