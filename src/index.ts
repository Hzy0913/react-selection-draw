import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Rx from 'rxjs/Rx';
import FontIcon from "src/components/icons/FontIcon";
import { computedPosition, setLinkStyle, computedXandY, computedSize, setOffsetStyle } from './utils';

// updateLink 实例方法，用于更新links
// getLinks 实例方法，用于获取links
type linksType = {
  [key: number]: {
    x: number
    y: number
    width: number
    height: number
  }
}
interface optionInterface {
  canvasClassName: string;
  linksClassName: string;
  imgClassName: string;
  offsetSize?: number; // 拖拽时候可超出的偏移量
  operationClassName: string;
  onDelete?: (id: string) => any;
  linksChange?: (link, key, value) => any;
  linkOnClick?: (event) => any;
  linkOnDblclick?: (event) => any;
  selectOnChange?: (selected) => any;
  linkCreated?: (id) => any;
  getLinks?: () => any;
  containerSize?: (size) => any;
  links?: linksType
}
export default class DrawLink  {
  onDelete;
  linksChange;
  linkOnClick;
  linkOnDblclick;
  selectOnChange;
  hooks: any = {};
  canvasDom: HTMLElement;
  linksDom: HTMLElement;
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

  links: any;
  imgContainer = {
    width: undefined,
    height: undefined,
  }

  currentLinkId; // 当前热区id
  currentLinkDom: HTMLElement; // 当前热区dom

  moveStart: boolean = false; //开始绘制热区移动
  createLinkPosition = {
    x: undefined,
    y: undefined,
    width: undefined,
    height: undefined,
    startX: undefined,
    startY: undefined,
  };

  linkMoveStart;  //开始拖拽热区移动
  currentX; // 当前热区移动X
  currentY;
  offsetX;  // 当前热区移动X偏移量
  offsetY;

  linkSizeStart; // 开始重置热区大小
  resizeDirectionInfo; // 调整方向信息

  constructor(options: optionInterface) {
    this.init(options || {});
  }

  init(options) {
    const { canvasClassName, linksClassName, imgClassName, operationClassName, onDelete,
      linksChange, links = {}, linkOnClick, selectOnChange, offsetSize = 0, linkOnDblclick,
      linkCreated, containerSize,
    } = options as optionInterface;
    this.hooks = {
      linkCreated,
      containerSize,
    }
    this.onDelete = onDelete;
    this.offsetSize = offsetSize;
    this.linksChange = linksChange;
    this.linkOnClick = linkOnClick;
    this.linkOnDblclick = linkOnDblclick;
    this.selectOnChange = selectOnChange;
    this.links = new Proxy({}, {
      get(target, key) {
        const value = target[key]
        return value;
      },
      set: (target, key, value) => {
        const isSet = Reflect.set(target, key, value);
        return isSet;
      }
    });
    this.canvasDom = document.querySelector(`.${canvasClassName}`);
    this.linksDom = document.querySelector(`.${linksClassName}`);
    this.operationDom = document.querySelector(`.${operationClassName}`);

    const mousedownObservable = Rx.Observable.fromEvent(this.linksDom, 'mousedown');
    const mouseMoveObservable = Rx.Observable.fromEvent(this.canvasDom, 'mousemove');
    const mouseLeaveObservable = Rx.Observable.fromEvent(this.operationDom, 'mouseleave');
    const mouseUpObservable = Rx.Observable.fromEvent(this.canvasDom, 'mouseup');
    const linkClickObservable = Rx.Observable.fromEvent(this.linksDom, 'click');

    this.mousedownSubscriber(mousedownObservable, linksClassName);
    this.mouseMoveSubscriber(mouseMoveObservable);
    this.mouseLeaveSubscriber(mouseLeaveObservable);
    this.mouseUpSubscriber(mouseUpObservable);
    this.linkClickSubscriber(linkClickObservable);

    this.loadImage(imgClassName).then(() => this.updateLink(links, undefined, true))
  }

  mousedownSubscriber(mousedownObservable, linksClassName) {
    this.mousedownObservable = mousedownObservable.subscribe({
      next: (value) => {
        if (this.mousedownTimeStamp) {
          this.mousedownTimeStampSecond = +new Date;
        } else {
          this.mousedownTimeStamp = +new Date;
        }

        setTimeout(() => {
          this.mousedownTimeStamp = 0;
          this.mousedownTimeStampSecond = 0;
        }, 300);

        this.eventTarget = value;
        this.linkDomDownTrigger(value);

        if (this.setLinkPositionDown(value)) return;

        if (this.createLinkDown(value, linksClassName)) return;

        if (this.resizeLinkDown(value)) return;
      },
    });
  }

  mouseMoveSubscriber(mouseMoveObservable) {
    this.mouseMoveObservable = mouseMoveObservable.subscribe({
      next: (value) => {
        if (this.setLinkPositionMove(value)) return;

        if (this.resizeLinkMove(value)) return;

        if (this.createLinkMove(value)) return;
      }
    });
  }

  mouseLeaveSubscriber(mouseLeaveObservable) {
    this.mouseLeaveObservable = mouseLeaveObservable.subscribe({
      next: (value) => {
        this.removeSmallLink();
        this.recordLinkState();
        this.currentLinkDom && this.currentLinkDom.classList.remove('image-map-link-no-show-operation');
        this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);

        this.currentLinkId = undefined
        this.currentLinkDom = undefined;
        this.moveStart = undefined;
        this.linkMoveStart = undefined;
        this.linkSizeStart = undefined;
        this.resizeDirectionInfo = undefined;

        this.canvasDom.classList.remove('link-resizing', 'link-resizing-nesw');
        this.canvasDom.style.display = 'none';
      }
    });
  }

  mouseUpSubscriber(mouseUpObservable) {
    this.mouseUpObservable = mouseUpObservable.subscribe({
      next: (value) => {
        const currentTimeStamp = +new Date;
        if (this.mousedownTimeStampSecond) {
          this.linkDomDblclickTrigger(this.eventTarget);
          this.eventTarget = undefined;
        } else if (currentTimeStamp - this.mousedownTimeStamp < 120) {
          this.linkDomClickTrigger(this.eventTarget);
          this.eventTarget = undefined;
        }

        if (this.setLinkPositionUp(value)) return;

        if (this.resizeLinkUp(value)) return;

        if (this.createLinkUp(value)) return;
      },
    });
  }

  linkClickSubscriber(linkClickObservable) {
    this.linkClickObservable = linkClickObservable.subscribe({
      next: (value) => {
        if (!~value.target.classList.contains('image-map-link')) return;

        this.currentLinkDom = undefined;
        this.linkMoveStart = false;
        this.canvasDom.style.display = 'none';
        this.currentLinkId = undefined;
      },
    });
  }

  destroy() {
    if (this.mousedownObservable) {
      this.mousedownObservable.unsubscribe();
      this.mouseMoveObservable.unsubscribe();
      this.mouseUpObservable.unsubscribe();
      this.linkClickObservable.unsubscribe();
    }
  }

  setLinkPositionDown(value) {
    setOffsetStyle(this.canvasDom, this.imgContainer, this.offsetSize, true);

    const { target } = value || {};

    if (target.classList.contains('link-usable-dnd')) {
      const { id, node } = this.findHasIdDom(target);

      this.currentLinkId = id;
      this.currentLinkDom = node;
      this.useDomSetLinksInfo(target);
      this.linkMoveStart = true;
      this.canvasDom.style.display = 'block';
      this.canvasDom.classList.add('link-grabbing');

      return true;
    }
  }

  setLinkPositionMove(value) {
    if (this.linkMoveStart) {
      const { clientX, clientY } = value || {};
      if (!this.currentX) { //设置当前拖拽link的定位点
        this.currentX = clientX;
        this.currentY = clientY;
      } else if (this.currentLinkDom) {
        this.offsetX = clientX - this.currentX; // 设置当前拖拽link的偏移量
        this.offsetY = clientY - this.currentY;
        const id = this.currentLinkId;

        if (id) {
          const { x: positionX, y: positionY, width, height } = this.links[id] || {};
          const x = computedPosition({
            position: this.links[id],
            offsetX: this.offsetX,
            container: this.imgContainer,
          });
          const y = computedPosition({
            position: this.links[id],
            offsetY: this.offsetY,
            container: this.imgContainer,
          });

          (this.links[id] || {}).lastX = x;
          (this.links[id] || {}).lastY = y;
          this.linkChange(this.links, id, {x, y});

          this.currentLinkDom.style.left = x + 'px';
          this.currentLinkDom.style.top = y + 'px';
        }
      }

      return true;
    }
  }

  setLinkPositionUp(value) {
    if (this.linkMoveStart) {
      const id = this.currentLinkId;
      if (id && this.links[id]) {
        const { lastX, lastY } = this.links[id] || {};
        this.links[id].x = lastX;
        this.links[id].y = lastY;
        this.linkChange(this.links, id, {x: lastX, y: lastY});
      }
      this.useDomSetLinksInfo(this.currentLinkDom);

      this.currentLinkDom = undefined;
      this.currentX = undefined;
      this.currentY = undefined;
      this.currentLinkId = undefined;
      this.currentLinkDom = undefined;
      this.linkMoveStart = false;
      this.canvasDom.style.display = 'none';
      this.canvasDom.classList.remove('link-grabbing');

      return true;
    }
  }

  createLinkDown(value, linksClassName) {
    setOffsetStyle(this.canvasDom, this.imgContainer, this.offsetSize, false);

    const { target, clientX, clientY, offsetX, offsetY  } = value || {};

    if (value.target.classList.contains(linksClassName)) {
      this.moveStart = true;
      this.createLinkPosition.x = offsetX;
      this.createLinkPosition.y = offsetY;

      this.createLinkPosition.startX = offsetX;
      this.createLinkPosition.startY = offsetY;

      this.canvasDom.style.display = 'block';

      return true;
    };
  }

  createLinkMove(value) {
    if (this.moveStart) {
      const { offsetX, offsetY } = value || {};
      const { startX, startY } = this.createLinkPosition || {};
      const { width: imgContainerWidth, height: imgContainerHeight } = this.imgContainer;

      if (!this.currentLinkDom) {
        this.renderLink(undefined, false)
      }

      const direction = this.drawDirection({offsetX, offsetY, startX, startY});
      const width = Math.abs(~direction.indexOf('right') ? offsetX - startX : startX - offsetX);
      const height = Math.abs(~direction.indexOf('bottom') ? offsetY - startY : startY - offsetY);
      const currentLinkDom = this.currentLinkDom;

      this.createLinkPosition.width = width;
      this.createLinkPosition.height = height;

      currentLinkDom.style.width = width + 'px';
      currentLinkDom.style.height = height + 'px';

      const [directionX, directionY, posiX, posiY] = this.transformPosition(direction, startX, startY, this.imgContainer);
      ['left', 'right', 'top', 'bottom'].forEach(attribute => currentLinkDom.style[attribute] = 'auto');

      currentLinkDom.style[directionX] = posiX + 'px';
      currentLinkDom.style[directionY] = posiY + 'px';

      this.links[this.currentLinkId] = {
        ...this.transformXandY({direction, width, height, startX, startY}),
        width,
        height,
      };

      return true;
    }
  }

  createLinkUp(value) {
    if (this.moveStart) {
      this.currentLinkDom && this.currentLinkDom.classList.remove('image-map-link-no-show-operation');
      this.removeSmallLink();

      this.moveStart = false;
      this.currentLinkDom = undefined;
      this.canvasDom.style.display = 'none';
      this.currentX = undefined;
      this.currentY = undefined;
      this.createLinkPosition = {
        x: undefined,
        y: undefined,
        width: undefined,
        height: undefined,
        startX: undefined,
        startY: undefined,
      };

      this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);
      this.currentLinkId = undefined;

      return true;
    }
  }

  resizeLinkDown(value) {
    setOffsetStyle(this.canvasDom, this.imgContainer, this.offsetSize, true);
    const { target } = value || {};
    if (target.classList.contains('link-resize')) {
      const [, direction] = target.className.split(' ').find(v => ~v.indexOf('link-direction')).split('link-direction-');
      this.currentLinkDom = target.parentNode.parentNode;
      this.currentLinkId = this.currentLinkId || this.currentLinkDom.getAttribute('data-id');
      const currentPosition = this.links[this.currentLinkId] || {};
      const { width: containerWidth, height: containerHeight } = this.imgContainer;

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
          setLinkStyle(this.currentLinkDom, mergePosition, true);
          break;
        case 'left-bottom':
          mergePosition = {
            right: this.resizeDirectionInfo.rightTopX,
            top: this.resizeDirectionInfo.rightTopY,
          };
          setLinkStyle(this.currentLinkDom, mergePosition, true)
          break;
        case 'right-bottom':
          mergePosition = {
            left: this.resizeDirectionInfo.leftTopX,
            top: this.resizeDirectionInfo.leftTopY,
          };
          setLinkStyle(this.currentLinkDom, mergePosition, true);
          break;
      }

      this.links[this.currentLinkId] = {
        ...this.links[this.currentLinkId],
        ...mergePosition,
      }

      this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);

      this.linkSizeStart = true;
      this.canvasDom.style.display = 'block';
      this.canvasDom.classList.add(direction === 'left-bottom' ? 'link-resizing-nesw' : 'link-resizing');

      return true;
    }
  }

  resizeLinkMove(value) {
    if (this.linkSizeStart) {
      const { offsetX, offsetY } = value || {};
      const currentPosition = this.links[this.currentLinkId];
      const { x, y } = currentPosition;
      const { width: containerWidth, height: containerHeight } = this.imgContainer;
      const currentLinkDom = this.currentLinkDom;
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

          setLinkStyle(currentLinkDom, mergeStyle)
          break;
        case 'left-bottom':
          mergeStyle = {
            width: computedSize(offsetX - this.offsetSize, rightTopX, direction, containerWidth)(containerWidth),
            height: computedSize(offsetY - this.offsetSize, rightTopY, direction)(containerHeight),
          };

          setLinkStyle(currentLinkDom, mergeStyle)
          break;
        case 'right-bottom':
          mergeStyle = {
            width: computedSize(offsetX - this.offsetSize, leftTopX, direction)(containerWidth),
            height: computedSize(offsetY - this.offsetSize, leftTopY, direction)(containerHeight),
          };


          setLinkStyle(currentLinkDom, mergeStyle)
          break;
      }

      currentLinkDom.style.width = width + 'px';
      currentLinkDom.style.height = height + 'px';

      this.links[this.currentLinkId] = {
        ...this.links[this.currentLinkId],
        ...mergeStyle,
      };

      this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);

      return true;
    }
  }

  resizeLinkUp(value) {
    if (this.linkSizeStart) {
      this.recordLinkState(); // 记录最后的状态

      this.resizeDirectionInfo = {};
      this.linkSizeStart = false;
      this.currentLinkDom = undefined;
      this.currentLinkId = undefined;
      this.canvasDom.style.display = 'none';
      this.canvasDom.classList.remove('link-resizing', 'link-resizing-nesw');
      return true;
    }
  }

  loadImage(imgClassName) {
    return new Promise(resolve => {
      const imgDom = document.querySelector(`.${imgClassName}`) as any;
      const { containerSize } = this.hooks;
      if (!imgDom) return;

      imgDom.onload = () => {
        this.imgContainer = {
          width: imgDom.clientWidth,
          height: imgDom.clientHeight,
        }

        containerSize && containerSize(this.imgContainer)
        resolve(this.imgContainer)
      }

      (function loopSetWidth() {
        if (imgDom.complete) {
          this.imgContainer = {
            width: imgDom.clientWidth,
            height: imgDom.clientHeight,
          }

          containerSize && containerSize(this.imgContainer)
          return resolve(this.imgContainer)
        }

        setTimeout(loopSetWidth.bind(this), 20);
      }.bind(this))();
    })
  }

  recordLinkState() {
    const currentLink = this.links[this.currentLinkId];
    if (!(this.resizeDirectionInfo || {}).direction || !currentLink) return;

    const axis = computedXandY(this.resizeDirectionInfo.direction, this.imgContainer, currentLink);
    this.links[this.currentLinkId] = {
      ...currentLink,
      ...axis
    };

    this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);
  }

  renderLink(createId, showOperation: boolean, link?) {
    const { linkCreated } = this.hooks;
    const id = createId || String(+new Date());
    this.currentLinkDom = document.createElement('div');

    ReactDOM.render(<div>
      <div
        className="link-delete"
    onClick={(e) => this.onDelete && this.onDelete(id)}
  >
    <FontIcon size={14} iconName='icon-tag-guanbi' />
      </div>
      <div className="link-resize link-direction-right-bottom" />
    <div className="link-resize link-direction-left-bottom" />
    <div className="link-resize link-direction-left-top" />
    <div className="link-resize link-direction-right-top" />
    <div className="link-node link-usable-dnd" >{(link || {}).text}</div>
    </div>, this.currentLinkDom);

    this.currentLinkDom.setAttribute('data-id', id);
    this.currentLinkId = id;
    this.links[id] = link || {};
    const showOperationClassName = showOperation ? undefined : 'image-map-link-no-show-operation';
    this.currentLinkDom.classList.add(...['image-map-link', 'link-usable-dnd', showOperationClassName].filter(v => v));
    this.linksDom.appendChild(this.currentLinkDom);

    const { x: left, y: top, width, height } = this.links[id];
    if (width) {
      this.currentLinkDom.style.left = left + 'px';
      this.currentLinkDom.style.top = top + 'px';
      this.currentLinkDom.style.width = width + 'px';
      this.currentLinkDom.style.height = height + 'px';
    }

    linkCreated && linkCreated(this.currentLinkId);
    return this.currentLinkDom;
  }

  removeSmallLink() {
    const { width, height } = this.createLinkPosition;
    if (width < this.createMinSize || height < this.createMinSize) {
      const currentLinkId = this.currentLinkId || (this.currentLinkDom && this.currentLinkDom.getAttribute('data-id'));

      if (currentLinkId) {
        delete this.links[currentLinkId];
      }

      this.linksDom.removeChild(this.currentLinkDom);

      return true;
    }
  }

  getLinks() {
    return this.links;
  }

  updateLink(links = {}, id?: string, isInit?: boolean) {
    const deleteLinks: string[] = Object.keys(this.links || {}).filter(key => !links[key]);
    const addLinks: string[] = isInit ? Object.keys(links): Object.keys(links).filter(key => !this.links[key]);

    if (deleteLinks.length) {
      deleteLinks.forEach(this.deleteLink);
    }

    if (addLinks.length) {
      addLinks.forEach((id) => this.addLink(id, links));
      this.linkChange(this.links, addLinks, links);
    }

    if (id) {
      this.modifyLink(id, links);
    }
  }

  linkDomDownTrigger(event) {
    let selectedEvent;
    const selectLinkClassName = 'image-map-link-selected';
    const links = this.linksDom.querySelectorAll('.image-map-link');
    links.forEach(link => link.classList.remove(selectLinkClassName));

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
    this.linkOnClick && this.linkOnClick(event)
  }

  linkDomDblclickTrigger(event) {
    this.linkOnDblclick && this.linkOnDblclick(event)
  }

  linkChange(link, key, value) {
    this.linksChange && this.linksChange(link, key, value);
  }

  addLink = (id, links) => {
    const linkDom = this.renderLink(id, true, links[id]);
    const { x: left, y: top, width, height } = links[id] || {};
    linkDom.style.left = left + 'px';
    linkDom.style.top = top + 'px';
    linkDom.style.width = width + 'px';
    linkDom.style.height = height + 'px';

    this.currentLinkId = undefined;
    this.currentLinkDom = undefined;

    this.links[id] = links[id];
  }

  modifyLink = (id, links) => {
    const linkDom = document.querySelector(`[data-id="${id}"]`);
    this.linksDom.removeChild(linkDom);

    this.addLink(id, links);
  }

  deleteLink = (id) => {
    const link = document.querySelector(`[data-id="${id}"]`);
    this.linksDom.removeChild(link);
    delete this.links[id];
    this.linkChange(this.links, id, undefined);
  }

  drawDirection({offsetX, offsetY, startX, startY}) {
    if (offsetX > startX) {
      return offsetY > startY  ? 'right-bottom' : 'right-top';
    } else {
      return offsetY > startY ? 'left-bottom' : 'left-top';
    }
  }

  transformPosition(direction, startX, startY, imgContainer) {
    const { width, height } = imgContainer;
    const right = width - startX;
    const bottom = height - startY;

    return {
      'right-bottom': ['left', 'top', startX, startY],
      'right-top': ['left', 'bottom', startX, bottom],
      'left-top': ['right', 'bottom', right, bottom],
      'left-bottom': ['right', 'top', right, startY],
    }[direction];
  }

  transformXandY({direction, width, height, startX, startY}) {
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

  useDomSetLinksInfo(dom) {
    const currentLinkId = dom && dom.getAttribute('data-id');
    if (!currentLinkId) return;

    const { width, x } = this.links[currentLinkId];

    if (dom) {
      const { width: domWidth, height: domHeight } = dom.getBoundingClientRect() || {};

      this.links[currentLinkId] = {
        width: domWidth,
        height: domHeight,
        x: dom.offsetLeft,
        y: dom.offsetTop,
      };

      this.linkChange(this.links, currentLinkId, this.links[currentLinkId]);
    }
  }
}
