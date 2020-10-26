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

function setLinkStyle(dom, style, setPosition?: boolean) {
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

export {
  delay,
  setLinkStyle,
  setOffsetStyle,
  createElement,
  finddDomByDataId,
  findHasIdDom,
  transformXandY,
}
