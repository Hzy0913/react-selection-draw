type computedPositionType = {
  position: any,
  offsetX?: number,
  offsetY?: number,
  container: any
}
function computedPosition({position, offsetX, offsetY, container}: computedPositionType) {
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

function computedSize(offset, position, direction, containerSize?) {
  const minSizeNume = 12;
  let size = 0;

  switch (direction) {
    case 'left-top':
      size = containerSize - offset - position;
      break;
    case 'left-bottom':
      size = containerSize ? containerSize - offset - position : offset - position;
      break;
    case 'right-bottom':
      size = offset - position;
      break;
  }

  size = size < minSizeNume ? minSizeNume : size;

  return function minSize(maxSize) {
    return maxSize - size - position < 0 ? maxSize - position : size;
  }
}

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

function computedXandY(direction, imgContainer, currentLink) {
  const { width: containerWidth, height: containerHeight } = imgContainer;
  const { width, height, right, left, top, bottom } = currentLink;

  switch (direction) {
    case 'left-top':
      return {
        x: containerWidth - right - width,
        y: containerHeight - bottom - height
      };
    case 'left-bottom':
      return {
        x: containerWidth - right - width,
        y: top
      };
    case 'right-bottom':
      return {
        x: left,
        y: top
      };
  }
}

function setLinkStyle(dom, style, setPosition?: boolean) {
  setPosition && ['left', 'right', 'top', 'bottom'].forEach(attribute => dom.style[attribute] = 'auto');
  Object.keys(style).forEach(attribute => {
    dom.style[attribute] = style[attribute] + 'px';
  });
}

export {
  computedPosition,
  setLinkStyle,
  computedXandY,
  computedSize,
  setOffsetStyle,
}
