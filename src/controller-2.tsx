import { computedPosition, setSelectionStyle,
  computedXandY, computedSize, setOffsetStyle, generatorId } from './utils';
import React from 'react';
import ReactDOM from 'react-dom';
import Selection from './selection';

// // updateLink 实例方法，用于更新selections
// // getselections 实例方法，用于获取selections
// import Events from './events';
// type selectionsType = {
//   [key: number]: {
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//   };
// };
// interface OptionInterface {
//   el: string | HTMLDivElement;
//   canvasClassName: string;
//   selectionsClassName: string;
//   imgClassName: string;
//   offsetSize?: number; // 拖拽时候可超出的偏移量
//   operationClassName: string;
//   onDelete?: (id: string) => any;
//   selectionChange?: (link, key, value) => any;
//   selectionOnClick?: (event) => any;
//   selectionOnDblclick?: (event) => any;
//   selectOnChange?: (selected) => any;
//   linkCreated?: (id) => any;
//   getselections?: () => any;
//   containerSize?: (size) => any;
//   selections?: selectionsType;
// }
export default class Controller  {
  events;

  selectionDom;
  canvasDom: HTMLElement;
  selectionsContainer;
  imgElement;

  onDelete;
  selectionChange;
  selectionOnClick;
  selectionOnDblclick;
  selectOnChange;
  hooks: any = {};
  selectionsDom: HTMLElement;
  operationDom: HTMLElement;

  mousedownObservable;
  mouseMoveObservable;
  mouseLeaveObservable;
  mouseUpObservable;
  linkClickObservable;

  createMinSize: number = 10;
  offsetSize: number = 50;

  mousedownTimeStamp: number;
  mousedownTimeStampSecond: number;
  eventTarget: any;

  selections: any = {};
  imgInfo = {
    width: 400 || undefined,
    height: 400 ||  undefined,
  };

  currentSelectionId; // 当前热区id
  currentSelectionDom: HTMLElement; // 当前热区dom

  moveStart: boolean = false; // 开始绘制热区移动
  createSelectionPosition = {
    x: undefined,
    y: undefined,
    width: undefined,
    height: undefined,
    startX: undefined,
    startY: undefined,
  };

  selectionMoveStart;  // 开始拖拽热区移动
  currentX; // 当前热区移动X
  currentY;
  offsetX;  // 当前热区移动X偏移量
  offsetY;

  selectionSizeStart; // 开始重置热区大小
  resizeDirectionInfo; // 调整方向信息

  constructor(options) {
    const { onDelete } = options || {};
    this.setProps({ onDelete });
    this.recordSelectionstate = this.recordSelectionstate.bind(this);
  }

  setProps(props) {
    const { onDelete } = props;

    this.onDelete = onDelete;
  }

  bindElementRef(doms) {
    Object.keys(doms).forEach(name => this[name] = doms[name]);
  }

  setLinkPositionDown(event) {
    const { target } = event;
    console.log(target.classList, 'targettarget')
    setOffsetStyle(this.canvasDom, this.imgInfo, this.offsetSize, true);

    if (target.classList.contains('selection-usable-dnd')) {
      const { id, node } = this.findHasIdDom(target);

      this.currentSelectionId = id;
      this.currentSelectionDom = node;
      this.useDomSetselectionsInfo(target);
      this.selectionMoveStart = true;
      this.canvasDom.style.display = 'block';
      this.canvasDom.classList.add('selection-grabbing');

      return true;
    }
  }

  setLinkPositionMove(value) {
    console.log(this.selectionMoveStart)
    if (this.selectionMoveStart) {
      const { clientX, clientY } = value || {};
      if (!this.currentX) { // 设置当前拖拽link的定位点
        this.currentX = clientX;
        this.currentY = clientY;
      } else if (this.currentSelectionDom) {
        console.log(clientX, this.currentX, 1213123123);

        this.offsetX = clientX - this.currentX; // 设置当前拖拽link的偏移量
        this.offsetY = clientY - this.currentY;
        const id = this.currentSelectionId;

        if (id) {
          // const { x: positionX, y: positionY, width, height } = this.selections[id] || {};
          const x = computedPosition({
            position: this.selections[id],
            offsetX: this.offsetX,
            container: this.imgInfo,
          });
          const y = computedPosition({
            position: this.selections[id],
            offsetY: this.offsetY,
            container: this.imgInfo,
          });

          (this.selections[id] || {}).lastX = x;
          (this.selections[id] || {}).lastY = y;
          this.linkChange(this.selections, id, {x, y});

          this.currentSelectionDom.style.left = x + 'px';
          this.currentSelectionDom.style.top = y + 'px';
        }
      }

      return true;
    }
  }

  setLinkPositionUp(value) {
    if (this.selectionMoveStart) {
      const id = this.currentSelectionId;
      if (id && this.selections[id]) {
        const { lastX, lastY } = this.selections[id] || {};
        this.selections[id].x = lastX;
        this.selections[id].y = lastY;
        console.log(lastX, 1213123123);

        this.linkChange(this.selections, id, { x: lastX, y: lastY });
      }
      this.useDomSetselectionsInfo(this.currentSelectionDom);

      this.currentSelectionDom = undefined;
      this.currentX = undefined;
      this.currentY = undefined;
      this.currentSelectionId = undefined;
      this.currentSelectionDom = undefined;
      this.selectionMoveStart = false;
      this.canvasDom.style.display = 'none';
      this.canvasDom.classList.remove('selection-grabbing');

      return true;
    }
  }

  createLinkDown(event) {
    const { target } = event;

    setOffsetStyle(this.canvasDom, this.imgInfo, this.offsetSize, false);

    const { offsetX, offsetY } = event as any;

    if (target.classList.contains('selection-creator-selections-container')) {
      this.moveStart = true;
      this.createSelectionPosition.x = offsetX;
      this.createSelectionPosition.y = offsetY;

      this.createSelectionPosition.startX = offsetX;
      this.createSelectionPosition.startY = offsetY;

      this.canvasDom.style.display = 'block';

      return true;
    }
  }

  resetSelectioContext = () => {
    this.currentSelectionDom && this.currentSelectionDom.classList.remove('selection-no-show-operation');
    this.currentSelectionId = undefined;
    this.currentSelectionDom = undefined;
    this.moveStart = undefined;
    this.selectionMoveStart = undefined;
    this.selectionSizeStart = undefined;
    this.resizeDirectionInfo = undefined;

    this.currentX = undefined;
    this.currentY = undefined;

    this.toggleDragingCursor('remove');
    this.canvasDom.style.display = 'none';
  }

  createLinkMove(value) {
    if (this.moveStart) {
      const { offsetX, offsetY } = value || {};
      const { startX, startY } = this.createSelectionPosition || {};
      // const { width: imgInfoWidth, height: imgInfoHeight } = this.imgInfo;

      if (!this.currentSelectionDom) {
        this.renderLink(undefined, false);
      }

      const direction = this.drawDirection({offsetX, offsetY, startX, startY});
      const width = Math.abs(~direction.indexOf('right') ? offsetX - startX : startX - offsetX);
      const height = Math.abs(~direction.indexOf('bottom') ? offsetY - startY : startY - offsetY);
      const currentSelectionDom = this.currentSelectionDom;

      this.createSelectionPosition.width = width;
      this.createSelectionPosition.height = height;

      currentSelectionDom.style.width = width + 'px';
      currentSelectionDom.style.height = height + 'px';

      const [directionX, directionY, posiX, posiY] = this.transformPosition(direction, startX, startY, this.imgInfo);
      ['left', 'right', 'top', 'bottom'].forEach(attribute => currentSelectionDom.style[attribute] = 'auto');

      currentSelectionDom.style[directionX] = posiX + 'px';
      currentSelectionDom.style[directionY] = posiY + 'px';

      this.selections[this.currentSelectionId] = {
        ...this.transformXandY({direction, width, height, startX, startY}),
        width,
        height,
      };

      return true;
    }
  }

  createLinkUp(value) {
    if (this.moveStart) {
      this.currentSelectionDom && this.currentSelectionDom.classList.remove('selection-no-show-operation');
      this.removeSmallLink();

      this.moveStart = false;
      this.currentSelectionDom = undefined;
      this.canvasDom.style.display = 'none';
      this.currentX = undefined;
      this.currentY = undefined;
      this.createSelectionPosition = {
        x: undefined,
        y: undefined,
        width: undefined,
        height: undefined,
        startX: undefined,
        startY: undefined,
      };

      this.linkChange(this.selections, this.currentSelectionId, this.selections[this.currentSelectionId]);
      this.currentSelectionId = undefined;

      return true;
    }
  }

  resizeLinkDown(value) {
    setOffsetStyle(this.canvasDom, this.imgInfo, this.offsetSize, true);
    const { target } = value || {};
    if (target.classList.contains('selection-resize')) {
      const [, direction] = target.className.split(' ').find(v => ~v.indexOf('selection-direction')).split('selection-direction-');
      this.currentSelectionDom = target.parentNode.parentNode;
      this.currentSelectionId = this.currentSelectionId || this.currentSelectionDom.getAttribute('data-id');
      const currentPosition = this.selections[this.currentSelectionId] || {};
      const { width: containerWidth, height: containerHeight } = this.imgInfo;

      console.log(currentPosition, 213123123)
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
      console.log(direction)

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
          setSelectionStyle(this.currentSelectionDom, mergePosition, true)
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

      this.linkChange(this.selections, this.currentSelectionId, this.selections[this.currentSelectionId]);

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

  resizeLinkMove(value) {
    if (this.selectionSizeStart) {
      const { offsetX, offsetY } = value || {};
      // const currentPosition = this.selections[this.currentSelectionId];
      // const { x, y } = currentPosition;
      const { width: containerWidth, height: containerHeight } = this.imgInfo;
      const currentSelectionDom = this.currentSelectionDom;
      const { direction, leftTopX, leftTopY, rightTopX, rightTopY, rightBottomX, rightBottomY, leftBottomX, leftBottomY, height: lastHeight, width: lastWidth } = this.resizeDirectionInfo || {};
      let mergeStyle = {};
      const offsetComputedX = offsetX - this.offsetSize;
      const offsetComputedY = offsetY - this.offsetSize;
      let width;
      let height;

      console.log(this.resizeDirectionInfo,lastHeight, 123123123123)
      switch (direction) {
        case 'left-top':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: rightBottomX, containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedY, position: rightBottomY, containerSize: containerHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'top':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: leftBottomX, sectionSize: lastWidth,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedY, position: leftBottomY, containerSize: containerHeight,
            })(containerHeight),
          };
          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'right-top':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: leftBottomX,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedY, position: leftBottomY, containerSize: containerWidth,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'right':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: leftTopX, containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedX, position: leftTopY, sectionSize: lastHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle)
          break;
        case 'left-bottom':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: rightTopX, containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedY, position: rightTopY,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle)
          break;
        case 'bottom':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: leftTopX, sectionSize: lastWidth,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedY, position: leftTopY, containerSize: containerHeight,
            })(containerHeight),
          };
          setSelectionStyle(currentSelectionDom, mergeStyle);
          break;
        case 'right-bottom':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: leftTopX,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedY, position: leftTopY
            })(containerHeight),
          };
          setSelectionStyle(currentSelectionDom, mergeStyle)
          break;
        case 'left':
          mergeStyle = {
            width: computedSize({
              direction, offset: offsetComputedX, position: rightTopX, containerSize: containerWidth,
            })(containerWidth),
            height: computedSize({
              direction, offset: offsetComputedX, position: rightTopY, sectionSize: lastHeight,
            })(containerHeight),
          };

          setSelectionStyle(currentSelectionDom, mergeStyle)
          break;
      }

      currentSelectionDom.style.width = width + 'px';
      currentSelectionDom.style.height = height + 'px';

      this.selections[this.currentSelectionId] = {
        ...this.selections[this.currentSelectionId],
        ...mergeStyle,
      };

      this.linkChange(this.selections, this.currentSelectionId, this.selections[this.currentSelectionId]);

      return true;
    }
  }

  resizeLinkUp(value) {
    if (this.selectionSizeStart) {
      this.recordSelectionstate(); // 记录最后的状态

      this.resizeDirectionInfo = {};
      this.selectionSizeStart = false;
      this.currentSelectionDom = undefined;
      this.currentSelectionId = undefined;
      this.canvasDom.style.display = 'none';

      this.toggleDragingCursor('remove');
      return true;
    }
  }

  loadImage(imgClassName) {
    return new Promise((resolve) => {
      const imgDom = document.querySelector(`.${imgClassName}`) as any;
      const { containerSize } = this.hooks;
      if (!imgDom) return;

      imgDom.onload = () => {
        this.imgInfo = {
          width: imgDom.clientWidth,
          height: imgDom.clientHeight,
        };

        containerSize && containerSize(this.imgInfo);
        resolve(this.imgInfo);
      };

      (function loopSetWidth() {
        if (imgDom.complete) {
          this.imgInfo = {
            width: imgDom.clientWidth,
            height: imgDom.clientHeight,
          };

          containerSize && containerSize(this.imgInfo);
          return resolve(this.imgInfo);
        }

        setTimeout(loopSetWidth.bind(this), 20);
      }.bind(this))();
    });
  }

  recordSelectionstate() {
    console.log(this.currentSelectionId, 11112)
    const currentLink = this.selections[this.currentSelectionId];
    if (!(this.resizeDirectionInfo || {}).direction || !currentLink) return;

    const axis = computedXandY(this.resizeDirectionInfo.direction, this.imgInfo, currentLink);
    this.selections[this.currentSelectionId] = {
      ...currentLink,
      ...axis,
    };

    this.linkChange(this.selections, this.currentSelectionId, this.selections[this.currentSelectionId]);
  }

  createLink() {
    this.currentSelectionDom = document.createElement('div');
  }

  renderLink(createId, showOperation: boolean, link?) {
    console.log(this.currentSelectionDom, 'currentSelectionDomcurrentSelectionDom')
    const { linkCreated } = this.hooks;
    const id = createId || generatorId();
    this.currentSelectionDom = document.createElement('div');

    ReactDOM.render(<Selection
      key={id}
      id={id}
      onDelete={this.onDelete}
      doDelete={this.deleteSelection}
    />, this.currentSelectionDom);

    this.currentSelectionDom.setAttribute('data-id', id);
    this.currentSelectionId = id;
    this.selections[id] = link || {};
    const showOperationClassName = showOperation ? undefined : 'selection-no-show-operation';
    this.currentSelectionDom.classList.add(...['selection-node', 'selection-usable-dnd', showOperationClassName].filter(v => v));
    this.selectionsDom.appendChild(this.currentSelectionDom);

    const { x: left, y: top, width, height } = this.selections[id];
    if (width) {
      this.currentSelectionDom.style.left = left + 'px';
      this.currentSelectionDom.style.top = top + 'px';
      this.currentSelectionDom.style.width = width + 'px';
      this.currentSelectionDom.style.height = height + 'px';
    }

    linkCreated && linkCreated(this.currentSelectionId);
    return this.currentSelectionDom;
  }

  removeSmallLink() {
    const { width, height } = this.createSelectionPosition;
    if (width < this.createMinSize || height < this.createMinSize) {
      const currentSelectionId = this.currentSelectionId || (this.currentSelectionDom &&
        this.currentSelectionDom.getAttribute('data-id'));

      if (currentSelectionId) {
        delete this.selections[currentSelectionId];
      }

      this.selectionsDom.removeChild(this.currentSelectionDom);

      return true;
    }
  }

  getselections() {
    return this.selections;
  }

  updateLink(selections = {}, id?: string, isInit?: boolean) {
    const deleteselections: string[] = Object.keys(this.selections || {}).filter(key => !selections[key]);
    const addselections: string[] = isInit ? Object.keys(selections) : Object.keys(selections).filter(key => !this.selections[key]);

    if (deleteselections.length) {
      deleteselections.forEach(this.deleteSelection);
    }

    if (addselections.length) {
      addselections.forEach(id => this.addLink(id, selections));
      this.linkChange(this.selections, addselections, selections);
    }

    if (id) {
      this.modifyLink(id, selections);
    }
  }

  linkDomDownTrigger(event) {
    let selectedEvent;
    const selectLinkClassName = 'image-map-link-selected';
    const selections = this.selectionsDom.querySelectorAll('.selection-node');
    selections.forEach(link => link.classList.remove(selectLinkClassName));

    if (event.target.classList.contains('selection-node')) {
      event.target.classList.add(selectLinkClassName);
      selectedEvent = event;
    }

    if (event.target.classList.contains('link-resize') || event.target.classList.contains('link-node')) {
      const linkDom = event.target.parentNode.parentNode;
      linkDom.classList.add(selectLinkClassName);
      selectedEvent = { target: linkDom };
    }

    this.selectOnChange && this.selectOnChange(selectedEvent);
  }

  linkDomClickTrigger(event) {
    this.selectionOnClick && this.selectionOnClick(event)
  }

  linkDomDblclickTrigger(event) {
    this.selectionOnDblclick && this.selectionOnDblclick(event)
  }

  linkChange(link, key, value) {
    this.selectionChange && this.selectionChange(link, key, value);
  }

  addLink = (id, selections) => {
    const linkDom = this.renderLink(id, true, selections[id]);
    const { x: left, y: top, width, height } = selections[id] || {};
    linkDom.style.left = left + 'px';
    linkDom.style.top = top + 'px';
    linkDom.style.width = width + 'px';
    linkDom.style.height = height + 'px';

    this.currentSelectionId = undefined;
    this.currentSelectionDom = undefined;

    this.selections[id] = selections[id];
  }

  modifyLink = (id, selections) => {
    const linkDom = document.querySelector(`[data-id="${id}"]`);
    this.selectionsDom.removeChild(linkDom);

    this.addLink(id, selections);
  }

  deleteSelection = (id) => {
    const selection = this.selectionsDom.querySelector(`[data-id="${id}"]`);
    this.selectionsDom.removeChild(selection);
    delete this.selections[id];

    this.linkChange(this.selections, id, undefined);
  }

  drawDirection({ offsetX, offsetY, startX, startY }) {
    if (offsetX > startX) {
      return offsetY > startY  ? 'right-bottom' : 'right-top';
    }

    return offsetY > startY ? 'left-bottom' : 'left-top';
  }

  transformPosition(direction, startX, startY, imgInfo) {
    const { width, height } = imgInfo;
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

  findHasIdDom(dom) {
    const resut: any = (function findId(node, count) {
      if (!node || count > 3) return;

      const id = node && node.getAttribute('data-id');

      if (id) return { id, node };

      return findId(node.parentNode, count++);
    })(dom, 0);

    return resut || {};
  }

  useDomSetselectionsInfo(dom) {
    const currentSelectionId = dom && dom.getAttribute('data-id');
    if (!currentSelectionId) return;

    // const { width, x } = this.selections[currentSelectionId];

    if (dom) {
      const { width: domWidth, height: domHeight } = dom.getBoundingClientRect() || {};

      console.log(dom.offsetLeft, 'dom.offsetLeftdom.offsetLeft')
      this.selections[currentSelectionId] = {
        width: domWidth,
        height: domHeight,
        x: dom.offsetLeft,
        y: dom.offsetTop,
      };

      this.linkChange(this.selections, currentSelectionId, this.selections[currentSelectionId]);
    }
  }
}
