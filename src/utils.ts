import { TransformXandYType, ComputedSizeType, directionType } from './declare';

function setOffsetStyle(
  node: HTMLElement,
  container: { width: number, height: number },
  offsetSize = 0,
  isSet: boolean,
) {
  const { width, height } = container;
  const size = isSet ? offsetSize : 0;
  const styles = {
    width: `${width + (size * 2)}px`,
    height: `${height + (size * 2)}px`,
    left: `${-size}px`,
    top: `${-size}px`,
  };

  Object.keys(styles).forEach((attribute: string) => node.style[attribute] = styles[attribute]);
}

function setSelectionStyle(
  dom: HTMLElement, style: {[name: string]: number }, setPosition?: boolean,
) {
  setPosition && ['left', 'right', 'top', 'bottom'].forEach(attribute => dom.style[attribute] = 'auto');
  Object.keys(style).forEach((attribute: string) => {
    dom.style[attribute] = `${style[attribute]}px`;
  });
}

function delay(time?: number) {
  return new Promise(resolve => setTimeout(() => resolve(), time));
}

function findHasIdDom(dom) {
  const result: HTMLElement | void = (function findId(node, count: number) {
    if (!node || count > 3) return;

    const id = node && node.getAttribute('data-id');

    if (id) return { id, node };

    return findId(node.parentNode, count + 1);
  })(dom, 0);

  return result || {};
}

function transformXandY({ direction, width, height, startX, startY }: TransformXandYType) {
  switch (direction) {
    case 'right-bottom':
      return { x: startX, y: startY };
    case 'right-top':
      return { x: startX, y: startY - height };
    case 'left-top':
      return { x: startX - width, y: startY - height };
    case 'left-bottom':
      return { x: startX - width, y: startY };
  }
}

function computedPosition({ position, offsetX, offsetY, container } : any) {
  const { x, y, width, height } = position || {};
  const { width: containerWidth, height: containerHeight } = container || {};

  if (typeof offsetX === 'number') {
    if ((x + offsetX) < 0) return 0;

    if ((x + width + offsetX) > containerWidth) {
      return containerWidth - width;
    }

    return x + offsetX;
  }

  if ((y + offsetY) < 0) return 0;

  if ((y + height + offsetY) > containerHeight) {
    return containerHeight - height;
  }

  return y + offsetY;
}

function computedSize(
  { direction, offset, position, containerSize, sectionSize }: ComputedSizeType
) {
  const minSizeNume = 12;
  let size = 0;

  switch (direction) {
    case 'left-top':
      size = containerSize - offset - position;
      break;
    case 'top':
      size = sectionSize ? sectionSize : containerSize - offset - position;
      break;
    case 'right-top':
      size = containerSize ? containerSize - offset - position : offset - position;
      break;
    case 'right':
      size = sectionSize ? sectionSize : offset - position;
      break;
    case 'left-bottom':
      size = containerSize ? containerSize - offset - position : offset - position;
      break;
    case 'bottom':
      size = sectionSize ? sectionSize : offset - position;
      break;
    case 'right-bottom':
      size = offset - position;
      break;
    case 'left':
      size = sectionSize ? sectionSize : containerSize - offset - position
      break;
  }

  size = size < minSizeNume ? minSizeNume : size;

  return function minSize(maxSize) {
    return maxSize - size - position < 0 ? maxSize - position : size;
  };
}

function computedXandY(direction: directionType, container, currentSelection) {
  const { width: containerWidth, height: containerHeight } = container;
  const { width, height, right, left, top, bottom } = currentSelection;

  switch (direction) {
    case 'left-top':
      return {
        x: containerWidth - right - width,
        y: containerHeight - bottom - height,
      };
    case 'top':
      return {
        x: left,
        y: containerHeight - bottom - height,
      };
    case 'right-top':
      return {
        x: left,
        y: containerHeight - bottom - height,
      };
    case 'right':
      return {
        x: left,
        y: top,
      };
    case 'left-bottom':
      return {
        x: containerWidth - right - width,
        y: top,
      };
    case 'bottom':
      return {
        x: left,
        y: top,
      };
    case 'right-bottom':
      return {
        x: left,
        y: top,
      };
    case 'left':
      return {
        x: containerWidth - right - width,
        y: top,
      };
  }
}

function generatorId(): string {
  return String(+new Date() + Math.floor(Math.random() * 100000));
}

function getDataId(dom: HTMLElement): string {
  if (!dom) return;

  return dom.getAttribute('data-id');
}

function classNames(className = ''): string {
  return className.trim();
}

function queryParentDataIdByDom(dom: HTMLElement) {
  if (!dom) return;

  const dataId = dom && getDataId(dom);
  if (dataId) return [dataId, dom];

  return queryParentDataIdByDom((dom as any).parentNode);
}

export {
  delay,
  setSelectionStyle,
  setOffsetStyle,
  findHasIdDom,
  transformXandY,
  computedXandY,
  computedPosition,
  computedSize,
  generatorId,
  getDataId,
  queryParentDataIdByDom,
  classNames,
};
