import React from 'react';
import ReactDOM, { unmountComponentAtNode } from 'react-dom';
import Selection from './selection';
import { computedCreate, computedPosition, setSelectionStyle, computedXandY, computedSize,
  setOffsetStyle, generatorId, findHasIdDom, getDataId } from './utils';
import { selectionsType, contentType, directionType, UpdateSelection,
  createSelectionPositionType, quadrangularDirectionType } from './declare';

export default class Controller  {
  onDelete;
  selectionRender;
  selectionChange;
  selectionOnClick;
  selectOnChange;

  canvasDom: HTMLElement;
  selectionsDom: HTMLElement;

  createMinSize: number = 10;
  offsetSize: number;

  selections: selectionsType = {};
  containerInfo: { width: number; height: number; };

  currentSelectionId;
  currentSelectionDom: HTMLElement;

  createSelectionPosition: createSelectionPositionType = {
    x: undefined,
    y: undefined,
    width: undefined,
    height: undefined,
    startX: undefined,
    startY: undefined,
  };

  createMoveStart: boolean = false; // start move, when create a selection
  selectionMoveStart: boolean = false; // start move, when change a selection position
  selectionSizeStart: boolean = false; // start move, when resize a selection
  selectionMoving: boolean = false;

  currentX: number; // X of the current selection move
  currentY: number; // Y of the current selection move
  offsetX: number; // current offset of X
  offsetY: number; // current offset of Y
  resizeDirectionInfo: {
    direction: directionType;
    leftTopX: number;
    leftTopY: number;
    rightBottomX: number;
    rightBottomY: number;
    rightTopX: number;
    rightTopY: number;
    leftBottomX: number;
    leftBottomY: number;
    width: number;
    height: number;
  };

  constructor(options) {
    const { onDelete, selectionRender, selectionChange, offset, width, height } = options || {};
    this.setProps({ onDelete, selectionRender, selectionChange, offset, width, height });
    this.recordSelectionState = this.recordSelectionState.bind(this);
  }

  setProps(props) {
    const { onDelete, selectionRender, selectionChange, offset, width, height } = props;

    this.containerInfo = { width, height };
    this.onDelete = onDelete;
    this.offsetSize = offset;
    this.selectionRender = selectionRender;
    this.selectionChange = selectionChange;
  }

  bindElementRef(doms) {
    Object.keys(doms).forEach(name => this[name] = doms[name]);
  }

  setSelectionPositionDown(event) {
    const { target } = event;
    setOffsetStyle(this.canvasDom, this.containerInfo, this.offsetSize);

    if (target.classList.contains('selection-usable-dnd')) {
      const { id, node } = findHasIdDom(target);

      this.currentSelectionId = id;
      this.currentSelectionDom = node;
      this.setSelectionsInfoByDom(target);
      this.selectionMoveStart = true;
      this.canvasDom.style.display = 'block';
      this.canvasDom.classList.add('selection-grabbing');

      return true;
    }
  }

  setSelectionPositionMove(value) {
    if (this.selectionMoveStart) {
      const id = this.currentSelectionId;
      !this.selectionMoving && this.selectionChange('move-start', this.selections, id);
      this.selectionMoving = true;

      const { clientX, clientY } = value || {};
      if (!this.currentX) { // init current selection position info
        this.currentX = clientX;
        this.currentY = clientY;
      } else if (this.currentSelectionDom) {
        this.offsetX = clientX - this.currentX; // set offset of current selection
        this.offsetY = clientY - this.currentY;

        if (id) {
          const x = computedPosition({
            position: this.selections[id],
            offsetX: this.offsetX,
            container: this.containerInfo,
          });
          const y = computedPosition({
            position: this.selections[id],
            offsetY: this.offsetY,
            container: this.containerInfo,
          });

          (this.selections[id] || {} as selectionsType).lastX = x;
          (this.selections[id] || {} as selectionsType).lastY = y;

          this.selectionChange('move-ing', this.selections, id);

          this.currentSelectionDom.style.left = `${x}px`;
          this.currentSelectionDom.style.top = `${y}px`;
        }
      }

      return true;
    }
  }

  setSelectionPositionUp(value) {
    if (this.selectionMoveStart) {
      const id = this.currentSelectionId;

      if (id && this.selections[id]) {
        const { lastX, lastY } = this.selections[id] || {};
        this.selections[id].x = lastX;
        this.selections[id].y = lastY;
        this.selectionMoving && this.selectionChange('move-end', this.selections, id);
      }

      this.setSelectionsInfoByDom(this.currentSelectionDom);

      this.currentSelectionDom = undefined;
      this.currentX = undefined;
      this.currentY = undefined;
      this.currentSelectionId = undefined;
      this.currentSelectionDom = undefined;
      this.selectionMoveStart = false;
      this.selectionMoving = false;
      this.canvasDom.style.display = 'none';
      this.canvasDom.classList.remove('selection-grabbing');

      return true;
    }
  }

  createSelectionDown(event) {
    const { target } = event;
    const { offsetX, offsetY } = event;

    setOffsetStyle(this.canvasDom, this.containerInfo, this.offsetSize);

    if (target.classList.contains('selection-creator-selections-container')) {
      this.createMoveStart = true;
      this.createSelectionPosition.x = offsetX;
      this.createSelectionPosition.y = offsetY;
      this.createSelectionPosition.startX = offsetX;
      this.createSelectionPosition.startY = offsetY;
      this.canvasDom.style.display = 'block';

      return true;
    }
  }

  resetSelectionContext = () => {
    this.currentSelectionDom && this.currentSelectionDom.classList.remove('selection-no-show-operation');
    this.currentSelectionId = undefined;
    this.currentSelectionDom = undefined;
    this.createMoveStart = undefined;
    this.selectionMoveStart = undefined;
    this.selectionSizeStart = undefined;
    this.resizeDirectionInfo = undefined;

    this.currentX = undefined;
    this.currentY = undefined;

    this.toggleDragingCursor('remove');
    this.canvasDom.style.display = 'none';
  }

  createSelectionMove(value) {
    if (this.createMoveStart) {
      const { width: containerWidth, height: containerHeight } = this.containerInfo;
      const { startX, startY } = this.createSelectionPosition || {};
      let { offsetX, offsetY } = value || {};
      offsetX -= this.offsetSize;
      offsetY -= this.offsetSize;

      if (!this.currentSelectionDom) {
        this.renderSelection(undefined, false);
      }

      const direction = this.drawDirection({ offsetX, offsetY, startX, startY });
      const width = computedCreate({
        direction,
        offsetX,
        createPosition: this.createSelectionPosition,
        containerSize: containerWidth,
      });
      const height = computedCreate({
        direction,
        offsetY,
        createPosition: this.createSelectionPosition,
        containerSize: containerHeight,
      });
      const currentSelectionDom = this.currentSelectionDom;

      this.createSelectionPosition.width = width;
      this.createSelectionPosition.height = height;
      currentSelectionDom.style.width = `${width}px`;
      currentSelectionDom.style.height = `${height}px`;

      const [directionX, directionY, posiX, posiY] = this.transformPosition(direction, startX,
        startY, this.containerInfo);

      ['left', 'right', 'top', 'bottom'].forEach(attribute =>
        currentSelectionDom.style[attribute] = 'auto');

      currentSelectionDom.style[directionX] = `${posiX}px`;
      currentSelectionDom.style[directionY] = `${posiY}px`;

      this.selections[this.currentSelectionId] = {
        ...this.transformXandY({ direction, width, height, startX, startY }),
        width,
        height,
      };

      return true;
    }
  }

  createSelectionUp(value) {
    if (this.createMoveStart) {
      this.currentSelectionDom && this.currentSelectionDom.classList.remove('selection-no-show-operation');

      if (this.removeSmallSelection()) return;

      this.selectionChange('create', this.selections, this.currentSelectionId);

      this.resetSelectionContext();

      return true;
    }
  }

  resizeSelectionDown(value) {
    const { target } = value || {};
    setOffsetStyle(this.canvasDom, this.containerInfo, this.offsetSize);

    if (target.classList.contains('selection-resize')) {
      const [, direction] = target.className.split(' ').find(v =>
        ~v.indexOf('selection-direction')).split('selection-direction-');
      this.currentSelectionDom = target.parentNode.parentNode;
      this.currentSelectionId = this.currentSelectionId || this.currentSelectionDom.getAttribute('data-id');
      const currentPosition = (this.selections[this.currentSelectionId] || {}) as contentType;
      const { width: containerWidth, height: containerHeight } = this.containerInfo;

      this.resizeDirectionInfo = {
        direction,
        leftTopX: currentPosition.x,
        leftTopY: currentPosition.y,
        rightBottomX: containerWidth - currentPosition.x - currentPosition.width,
        rightBottomY: containerHeight - currentPosition.y - currentPosition.height,
        rightTopX: containerWidth - currentPosition.x - currentPosition.width,
        rightTopY: currentPosition.y,
        leftBottomX: currentPosition.x,
        leftBottomY: containerHeight - currentPosition.y - currentPosition.height,
        width: currentPosition.width,
        height: currentPosition.height,
      };
      let mergePosition = {};

      switch (direction) {
        case 'left-top':
          mergePosition = {
            right: this.resizeDirectionInfo.rightBottomX,
            bottom: this.resizeDirectionInfo.rightBottomY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'top':
          mergePosition = {
            left: this.resizeDirectionInfo.leftBottomX,
            bottom: this.resizeDirectionInfo.leftBottomY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'right-top':
          mergePosition = {
            left: this.resizeDirectionInfo.leftBottomX,
            bottom: this.resizeDirectionInfo.leftBottomY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'right':
          mergePosition = {
            left: this.resizeDirectionInfo.leftTopX,
            top: this.resizeDirectionInfo.leftTopY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'left-bottom':
          mergePosition = {
            right: this.resizeDirectionInfo.rightTopX,
            top: this.resizeDirectionInfo.rightTopY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'bottom':
          mergePosition = {
            left: this.resizeDirectionInfo.leftTopX,
            top: this.resizeDirectionInfo.leftTopY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'right-bottom':
          mergePosition = {
            left: this.resizeDirectionInfo.leftTopX,
            top: this.resizeDirectionInfo.leftTopY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'left':
          mergePosition = {
            right: this.resizeDirectionInfo.rightTopX,
            top: this.resizeDirectionInfo.rightTopY,
          };
          setSelectionStyle(this.currentSelectionDom, mergePosition, true);
          break;
      }

      this.selections[this.currentSelectionId] = {
        ...this.selections[this.currentSelectionId],
        ...mergePosition,
      };

      this.selectionChange('resize-start', this.selections, this.currentSelectionId);

      this.selectionSizeStart = true;
      this.canvasDom.style.display = 'block';
      this.toggleDragingCursor('add', direction);

      return true;
    }
  }

  toggleDragingCursor(method: 'add' | 'remove', direction?) {
    const directionStyle = {
      'right-top': 'selection-resizing-nesw',
      'left-bottom': 'selection-resizing-nesw',
      'left-top': 'selection-resizing',
      'right-bottom': 'selection-resizing',
      top: 'selection-ns-resizing',
      bottom: 'selection-ns-resizing',
      left: 'selection-ew-resizing',
      right: 'selection-ew-resizing',
    };

    if (method === 'remove') {
      return this.canvasDom.classList[method]('selection-resizing-nesw', 'selection-resizing', 'selection-ns-resizing', 'selection-ew-resizing');
    }

    this.canvasDom.classList[method](directionStyle[direction]);
  }

  resizeSelectionMove(value) {
    if (this.selectionSizeStart) {
      const { offsetX, offsetY } = value || {};
      const { width: containerWidth, height: containerHeight } = this.containerInfo;
      const currentSelectionDom = this.currentSelectionDom;
      const {
        direction, leftTopX, leftTopY, rightTopX, rightTopY, rightBottomX, rightBottomY,
        leftBottomX, leftBottomY, height: lastHeight, width: lastWidth,
      } = this.resizeDirectionInfo || {};
      const offsetComputedX = offsetX - this.offsetSize;
      const offsetComputedY = offsetY - this.offsetSize;
      let mergeStyle = {};

      switch (direction) {
        case 'left-top':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: rightBottomX,
              containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedY,
              position: rightBottomY,
              containerSize: containerHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'top':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: leftBottomX,
              sectionSize: lastWidth,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedY,
              position: leftBottomY,
              containerSize: containerHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'right-top':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: leftBottomX,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedY,
              position: leftBottomY,
              containerSize: containerHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'right':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: leftTopX,
              containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedX,
              position: leftTopY,
              sectionSize: lastHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'left-bottom':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: rightTopX,
              containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedY,
              position: rightTopY,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'bottom':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: leftTopX,
              sectionSize: lastWidth,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedY,
              position: leftTopY,
              containerSize: containerHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'right-bottom':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: leftTopX,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedY,
              position: leftTopY,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'left':
          mergeStyle = {
            width: computedSize({
              direction,
              offset: offsetComputedX,
              position: rightTopX,
              containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction,
              offset: offsetComputedX,
              position: rightTopY,
              sectionSize: lastHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
      }

      this.selections[this.currentSelectionId] = {
        ...this.selections[this.currentSelectionId],
        ...mergeStyle,
      };

      this.selectionChange('resize-ing', this.selections, this.currentSelectionId);

      return true;
    }
  }

  resizeSelectionUp(value) {
    if (this.selectionSizeStart) {
      this.selectionChange('resize-end', this.selections, this.currentSelectionId);
      this.recordSelectionState();

      this.resizeDirectionInfo = undefined;
      this.selectionSizeStart = false;
      this.currentSelectionDom = undefined;
      this.currentSelectionId = undefined;
      this.canvasDom.style.display = 'none';

      this.toggleDragingCursor('remove');
      return true;
    }
  }

  recordSelectionState() {
    const currentLink = this.selections[this.currentSelectionId];
    if (!(this.resizeDirectionInfo || {}).direction || !currentLink) return;

    const axis = computedXandY(this.resizeDirectionInfo.direction, this.containerInfo, currentLink);
    this.selections[this.currentSelectionId] = {
      ...currentLink,
      ...axis,
    };
  }

  renderSelection(createId, showOperation: boolean, link?) {
    const id = createId || generatorId();
    this.currentSelectionDom = document.createElement('div');
    this.selections[id] = link || {};
    const { x: left, y: top, width, height, node } = this.selections[id];

    ReactDOM.render(<Selection
      key={id}
      id={id}
      node={node}
      onDelete={this.onDelete}
      doDelete={this.deleteSelection}
      selectionRender={this.selectionRender}
    />, this.currentSelectionDom);

    this.currentSelectionDom.setAttribute('data-id', id);
    this.currentSelectionId = id;
    const showOperationClassName = showOperation ? undefined : 'selection-no-show-operation';
    this.currentSelectionDom.classList.add(...['selection-node', 'selection-usable-dnd',
      showOperationClassName].filter(v => v));
    this.selectionsDom.appendChild(this.currentSelectionDom);

    if (width) {
      this.currentSelectionDom.style.left = `${left}px`;
      this.currentSelectionDom.style.top = `${top}px`;
      this.currentSelectionDom.style.width = `${width}px`;
      this.currentSelectionDom.style.height = `${height}px`;
    }

    return this.currentSelectionDom;
  }

  removeSmallSelection() {
    const { width, height } = this.createSelectionPosition;

    if (width < this.createMinSize || height < this.createMinSize) {
      const currentSelectionId = this.currentSelectionId || (this.currentSelectionDom &&
        this.currentSelectionDom.getAttribute('data-id'));

      if (currentSelectionId) {
        delete this.selections[currentSelectionId];
      }

      this.selectionsDom.removeChild(this.currentSelectionDom);
      this.resetSelectionContext();

      return true;
    }
  }

  updateSelection(options: UpdateSelection) {
    const { id, type, content } = options || {};
    const { x, y, width, height, node } = content || {};

    switch (type) {
      case 'update':
        if (this.selections[id]) {
          this.selections[id] = content;
          const selectionDom: HTMLElement = this.selectionsDom.querySelector(`[data-id="${id}"]`);
          setSelectionStyle(selectionDom, { width, height, left: x, top: y });
          this.selectionChange('update', this.selections, id);
        }
        break;
      case 'add':
        const createId = generatorId();
        this.selections[createId] = content;
        this.renderSelection(createId, true, { x, y, width, height, node });
        this.selectionChange('add', this.selections, this.currentSelectionId);
        this.resetSelectionContext();
        break;
      case 'delete':
        this.deleteSelection(id);
    }
  }

  deleteSelection = (id) => {
    if (this.selections[id]) {
      const selection = this.selectionsDom.querySelector(`[data-id="${id}"]`);
      unmountComponentAtNode && unmountComponentAtNode(selection);
      this.selectionsDom.removeChild(selection);
      delete this.selections[id];

      this.selectionChange('delete', this.selections, id, undefined);
    }
  }

  drawDirection({ offsetX, offsetY, startX, startY }): quadrangularDirectionType {
    if (offsetX > startX) {
      return offsetY > startY  ? 'right-bottom' : 'right-top';
    }

    return offsetY > startY ? 'left-bottom' : 'left-top';
  }

  transformPosition(direction, startX, startY, containerInfo) {
    const { width, height } = containerInfo;
    const right = width - startX;
    const bottom = height - startY;

    return {
      'right-bottom': ['left', 'top', startX, startY],
      'right-top': ['left', 'bottom', startX, bottom],
      'left-top': ['right', 'bottom', right, bottom],
      'left-bottom': ['right', 'top', right, startY],
    }[direction];
  }

  transformXandY({ direction, width, height, startX, startY }) {
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

  setSelectionsInfoByDom(dom) {
    const selectionId = getDataId(dom);
    if (!selectionId) return;

    if (dom) {
      const { width: domWidth, height: domHeight } = dom.getBoundingClientRect() || {};

      this.selections[selectionId] = {
        width: domWidth,
        height: domHeight,
        x: dom.offsetLeft,
        y: dom.offsetTop,
      };
    }
  }
}
