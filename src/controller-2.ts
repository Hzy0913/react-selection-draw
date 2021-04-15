import { computedPosition, setselectionstyle, createDom,
  computedXandY, computedSize, setOffsetStyle } from './utils';

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
  offsetSize: number = 0;

  mousedownTimeStamp: number;
  mousedownTimeStampSecond: number;
  eventTarget: any;

  selections: any;
  imgInfo = {
    width: undefined,
    height: undefined,
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

  setLinkPositionDown(target) {
    setOffsetStyle(this.canvasDom, this.imgInfo, this.offsetSize, true);

    if (target.classList.contains('link-usable-dnd')) {
      const { id, node } = this.findHasIdDom(target);

      this.currentSelectionId = id;
      this.currentSelectionDom = node;
      this.useDomSetselectionsInfo(target);
      this.selectionMoveStart = true;
      this.canvasDom.style.display = 'block';
      this.canvasDom.classList.add('link-grabbing');

      return true;
    }
  }

  setLinkPositionMove(value) {
    if (this.selectionMoveStart) {
      const { clientX, clientY } = value || {};
      if (!this.currentX) { // 设置当前拖拽link的定位点
        this.currentX = clientX;
        this.currentY = clientY;
      } else if (this.currentSelectionDom) {
        this.offsetX = clientX - this.currentX; // 设置当前拖拽link的偏移量
        this.offsetY = clientY - this.currentY;
        const id = this.currentSelectionId;

        if (id) {
          const { x: positionX, y: positionY, width, height } = this.selections[id] || {};
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
        this.linkChange(this.selections, id, {x: lastX, y: lastY});
      }
      this.useDomSetselectionsInfo(this.currentSelectionDom);

      this.currentSelectionDom = undefined;
      this.currentX = undefined;
      this.currentY = undefined;
      this.currentSelectionId = undefined;
      this.currentSelectionDom = undefined;
      this.selectionMoveStart = false;
      this.canvasDom.style.display = 'none';
      this.canvasDom.classList.remove('link-grabbing');

      return true;
    }
  }

  createLinkDown(value, selectionsClassName) {
    setOffsetStyle(this.canvasDom, this.imgInfo, this.offsetSize, false);

    const { target, clientX, clientY, offsetX, offsetY  } = value || {};

    if (value.target.classList.contains(selectionsClassName)) {
      this.moveStart = true;
      this.createSelectionPosition.x = offsetX;
      this.createSelectionPosition.y = offsetY;

      this.createSelectionPosition.startX = offsetX;
      this.createSelectionPosition.startY = offsetY;

      this.canvasDom.style.display = 'block';

      return true;
    }
  }

  createLinkMove(value) {
    if (this.moveStart) {
      const { offsetX, offsetY } = value || {};
      const { startX, startY } = this.createSelectionPosition || {};
      const { width: imgInfoWidth, height: imgInfoHeight } = this.imgInfo;

      if (!this.currentSelectionDom) {
        this.renderLink(undefined, false)
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
      this.currentSelectionDom && this.currentSelectionDom.classList.remove('image-map-link-no-show-operation');
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
    if (target.classList.contains('link-resize')) {
      const [, direction] = target.className.split(' ').find(v => ~v.indexOf('link-direction')).split('link-direction-');
      this.currentSelectionDom = target.parentNode.parentNode;
      this.currentSelectionId = this.currentSelectionId || this.currentSelectionDom.getAttribute('data-id');
      const currentPosition = this.selections[this.currentSelectionId] || {};
      const { width: containerWidth, height: containerHeight } = this.imgInfo;

      this.resizeDirectionInfo = {
        direction,
        leftTopX: currentPosition.x,
        leftTopY: currentPosition.y,
        rightBottomX: containerWidth - currentPosition.x - currentPosition.width,
        rightBottomY: containerHeight - currentPosition.y - currentPosition.height,
        rightTopX: containerWidth - currentPosition.x - currentPosition.width,
        rightTopY: currentPosition.y,
      };

      let mergePosition = {};

      switch (direction) {
        case 'left-top':
          mergePosition = {
            right: this.resizeDirectionInfo.rightBottomX,
            bottom: this.resizeDirectionInfo.rightBottomY,
          };
          setselectionstyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'left-bottom':
          mergePosition = {
            right: this.resizeDirectionInfo.rightTopX,
            top: this.resizeDirectionInfo.rightTopY,
          };
          setselectionstyle(this.currentSelectionDom, mergePosition, true)
          break;
        case 'right-bottom':
          mergePosition = {
            left: this.resizeDirectionInfo.leftTopX,
            top: this.resizeDirectionInfo.leftTopY,
          };
          setselectionstyle(this.currentSelectionDom, mergePosition, true);
          break;
      }

      this.selections[this.currentSelectionId] = {
        ...this.selections[this.currentSelectionId],
        ...mergePosition,
      }

      this.linkChange(this.selections, this.currentSelectionId, this.selections[this.currentSelectionId]);

      this.selectionSizeStart = true;
      this.canvasDom.style.display = 'block';
      this.canvasDom.classList.add(direction === 'left-bottom' ? 'link-resizing-nesw' : 'link-resizing');

      return true;
    }
  }

  resizeLinkMove(value) {
    if (this.selectionSizeStart) {
      const { offsetX, offsetY } = value || {};
      const currentPosition = this.selections[this.currentSelectionId];
      const { x, y } = currentPosition;
      const { width: containerWidth, height: containerHeight } = this.imgInfo;
      const currentSelectionDom = this.currentSelectionDom;
      const { direction, leftTopX, leftTopY, rightTopX, rightTopY, rightBottomX, rightBottomY } = this.resizeDirectionInfo || {};
      let mergeStyle = {};
      let width;
      let height;

      switch (direction) {
        case 'left-top':
          mergeStyle = {
            width: computedSize(offsetX - this.offsetSize, rightBottomX, direction, containerWidth)(containerWidth),
            height: computedSize(offsetY - this.offsetSize, rightBottomY, direction, containerHeight)(containerHeight),
          };

          setselectionstyle(currentSelectionDom, mergeStyle)
          break;
        case 'left-bottom':
          mergeStyle = {
            width: computedSize(offsetX - this.offsetSize, rightTopX, direction, containerWidth)(containerWidth),
            height: computedSize(offsetY - this.offsetSize, rightTopY, direction)(containerHeight),
          };

          setselectionstyle(currentSelectionDom, mergeStyle)
          break;
        case 'right-bottom':
          mergeStyle = {
            width: computedSize(offsetX - this.offsetSize, leftTopX, direction)(containerWidth),
            height: computedSize(offsetY - this.offsetSize, leftTopY, direction)(containerHeight),
          };


          setselectionstyle(currentSelectionDom, mergeStyle)
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
      this.canvasDom.classList.remove('link-resizing', 'link-resizing-nesw');
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
    const { linkCreated } = this.hooks;
    const id = createId || String(+new Date());
    const linkDeleteNode = document.createElement('div');

    const selectionNode = createDom({name: 'span', className: 'selection-item-content'});
    const directionLeftTopNode = createDom({name: 'span', className: 'selection-direction-left-top'});
    const directionTopNode = createDom({name: 'span', className: 'selection-direction-top'});
    const directionRightTopNode = createDom({name: 'span', className: 'selection-direction-right-top'});
    const directionRightNode = createDom({name: 'span', className: 'selection-direction-right'});
    const directionRightBottomNode = createDom({name: 'span', className: 'selection-direction-right-bottom'});
    const directionBottomNode = createDom({name: 'span', className: 'selection-direction-bottom'});
    const directionLeftBttomNode = createDom({name: 'span', className: 'selection-direction-left-bottom'});
    const directionLeftNode = createDom({name: 'span', className: 'selection-direction-left'});

    selectionNode.appendChild(directionLeftTopNode);
    selectionNode.appendChild(directionTopNode);
    selectionNode.appendChild(directionRightTopNode);
    selectionNode.appendChild(directionRightNode);
    selectionNode.appendChild(directionRightBottomNode);
    selectionNode.appendChild(directionBottomNode);
    selectionNode.appendChild(directionLeftBttomNode);
    selectionNode.appendChild(directionLeftNode);

    //   ReactDOM.render(<div>
    //     <div
    //       className="link-delete"
    //   onClick={(e) => this.onDelete && this.onDelete(id)}
    // >
    //   <FontIcon size={14} iconName='icon-tag-guanbi' />
    //     </div>
    //     <div className="link-resize link-direction-right-bottom" />
    //   <div className="link-resize link-direction-left-bottom" />
    //   <div className="link-resize link-direction-left-top" />
    //   <div className="link-resize link-direction-right-top" />
    //   <div className="link-node link-usable-dnd" >{(link || {}).text}</div>
    //   </div>, this.currentSelectionDom);

    this.currentSelectionDom.setAttribute('data-id', id);
    this.currentSelectionId = id;
    this.selections[id] = link || {};
    const showOperationClassName = showOperation ? undefined : 'image-map-link-no-show-operation';
    this.currentSelectionDom.classList.add(...['image-map-link', 'link-usable-dnd', showOperationClassName].filter(v => v));
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
      deleteselections.forEach(this.deleteLink);
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
    const selections = this.selectionsDom.querySelectorAll('.image-map-link');
    selections.forEach(link => link.classList.remove(selectLinkClassName));

    if (event.target.classList.contains('image-map-link')) {
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

  deleteLink = (id) => {
    const link = document.querySelector(`[data-id="${id}"]`);
    this.selectionsDom.removeChild(link);
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

    const { width, x } = this.selections[currentSelectionId];

    if (dom) {
      const { width: domWidth, height: domHeight } = dom.getBoundingClientRect() || {};

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
