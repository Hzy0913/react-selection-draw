function setOffsetStyle(node, container, offsetSize = 0, isSet) {
  const { width, height } = container;
  const size = isSet ? offsetSize : 0;
  const styles = {
    width: width + (size * 2) + 'px',
    height: height + (size * 2) + 'px',
    left: -size + 'px',
    top: -size + 'px',
  }

  Object.keys(styles).forEach(attribute => {
    node.style[attribute] = styles[attribute];
  });
}

function setSelectionStyle(dom, style, setPosition?: boolean) {
  setPosition && ['left', 'right', 'top', 'bottom'].forEach(attribute => dom.style[attribute] = 'auto');
  Object.keys(style).forEach(attribute => {
    dom.style[attribute] = style[attribute] + 'px';
  });
}

function createElement(options) {
  const { classNames = [], style } = options || {} as any
  const element = document.createElement('div');
  Object.keys(style || {}).forEach(attribute => element.style[attribute] = style[attribute]);
  element.classList.add(...classNames);

  return element;
}

function delay(time: number) {
  return new Promise(resolve => setTimeout(() => resolve(), time));
}

function finddDomByDataId(dom) {
  const resut: any = (function findId(node, count) {
    if (!node || count > 3) return;

    const id = node && node.getAttribute('data-id');

    if (id) return { id, node };

    return findId(node.parentNode, count++);
  })(dom, 0);

  return resut || {};
}

function findHasIdDom(dom) {
  const resut: any = (function findId(node, count) {
    if (!node || count > 3) return;

    const id = node && node.getAttribute('data-id');

    if (id) return { id, node };

    return findId(node.parentNode, count++);
  })(dom, 0);

  return resut || {};
}

function transformXandY({direction, width, height, startX, startY}) {
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

function createDom({ name, className }) {
  const node = document.createElement(name);
  className && (node.className = className);
  return node;
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
  } else {
    if ((y + offsetY) < 0) return 0;

    if ((y + height + offsetY) > containerHeight) {
      return containerHeight - height;
    }

    return y + offsetY;
  }
}

function computedSize({ direction, offset, position, containerSize, sectionSize }: {direction; offset; position; containerSize?; sectionSize?}) {
  const minSizeNume = 12;
  let size = 0;

  console.log(offset, position, direction, containerSize, 123123123)
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

function computedXandY(direction, imgContainer, currentLink) {
  const { width: containerWidth, height: containerHeight } = imgContainer;
  const { width, height, right, left, top, bottom } = currentLink;

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
      console.log('width', width, 'height', height, 'right', right, 'left', left, 'top', top, 'bottom',bottom, 1231231233333)
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
      console.log('width', width, 'height', height, 'right', right, 'left', left, 'top', top, 'bottom', bottom, 1231231233333)
      return {
        x: containerWidth - right - width,
        y: top,
      };
  }
}

export {
  delay,
  createDom,
  setSelectionStyle,
  setOffsetStyle,
  createElement,
  finddDomByDataId,
  findHasIdDom,
  transformXandY,
  computedXandY,
  computedPosition,
  computedSize,
};
