import {findHasIdDom,computedPosition, computedSize, computedXandY, setLinkStyle, setOffsetStyle} from "./utils";
import SelectionCreator from "./index";

export default class Controller extends SelectionCreator {
  syncProperty;

  constructor(params) {
    super(params);
    const { syncProperty } = params;

    this.syncProperty = syncProperty;
  }

  createLinkMove({ target, moveStart, imgContainer }) {
    if (moveStart) {
      const { offsetX, offsetY } = target || {};
      const { startX, startY } = this.createSelectionPosition || {};
      const { width: imgContainerWidth, height: imgContainerHeight } = imgContainer as any;

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

      const [directionX, directionY, posiX, posiY] = this.transformPosition(direction, startX, startY, this.imgContainer);
      ['left', 'right', 'top', 'bottom'].forEach(attribute => currentSelectionDom.style[attribute] = 'auto');

      currentSelectionDom.style[directionX] = posiX + 'px';
      currentSelectionDom.style[directionY] = posiY + 'px';

      this.links[this.currentLinkId] = {
        ...this.transformXandY({direction, width, height, startX, startY}),
        width,
        height,
      };

      return true;
    }
  }

  resizeLinkMove({ target, selectionSizeStart, selection, currentSelectionId, imgContainer, offsetSize }) {
    if (selectionSizeStart) {
      const { offsetX, offsetY } = target || {};
      const currentPosition = selection[currentSelectionId];
      const { x, y } = currentPosition;
      const { width: containerWidth, height: containerHeight } = imgContainer;
      const currentSelectionDom = this.currentSelectionDom;
      const { direction, leftTopX, leftTopY, rightTopX, rightTopY, rightBottomX, rightBottomY } = this.resizeDirectionInfo || {};
      let mergeStyle = {};
      let width;
      let height;

      switch (direction) {
        case 'left-top':
          mergeStyle = {
            width: computedSize(offsetX - offsetSize, rightBottomX, direction, containerWidth)(containerWidth),
            height: computedSize(offsetY - offsetSize, rightBottomY, direction, containerHeight)(containerHeight),
          };

          setLinkStyle(currentSelectionDom, mergeStyle);
          break;
        case 'left-bottom':
          mergeStyle = {
            width: computedSize(offsetX - this.offsetSize, rightTopX, direction, containerWidth)(containerWidth),
            height: computedSize(offsetY - this.offsetSize, rightTopY, direction)(containerHeight),
          };

          setLinkStyle(currentSelectionDom, mergeStyle)
          break;
        case 'right-bottom':
          mergeStyle = {
            width: computedSize(offsetX - this.offsetSize, leftTopX, direction)(containerWidth),
            height: computedSize(offsetY - this.offsetSize, leftTopY, direction)(containerHeight),
          };

          setLinkStyle(currentSelectionDom, mergeStyle)
          break;
      }

      currentSelectionDom.style.width = width + 'px';
      currentSelectionDom.style.height = height + 'px';

      this.links[this.currentLinkId] = {
        ...this.links[this.currentLinkId],
        ...mergeStyle,
      };

      this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);

      return true;
    }
  }

  setLinkPositionMove({ target, currentX, currentY, currentSelectionDom }) {
    if (this.selectionMoveStart) {
      const { clientX, clientY } = target || {};
      if (!currentX) { // 设置当前拖拽link的定位点
        this.syncProperty(() => {
          this.currentX = clientX;
          this.currentY = clientY;
        });
      } else if (currentSelectionDom) {
        this.offsetX = clientX - currentX; // 设置当前拖拽link的偏移量
        this.offsetY = clientY - currentY;
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

          this.currentSelectionDom.style.left = x + 'px';
          this.currentSelectionDom.style.top = y + 'px';
        }
      }

      return true;
    }
  }

  setLinkPositionDown({ target, canvasContainer, imgContainer, offsetSize }) {
    setOffsetStyle(canvasContainer, imgContainer, offsetSize, true);

    if (target.classList.contains('link-usable-dnd')) {
      const { id, node } = findHasIdDom(target);

      this.syncProperty(() => {
        this.currentLinkId = id;
        this.currentSelectionDom = node;
        this.useDomSetLinksInfo(target);
        this.selectionMoveStart = true;
        this.canvasContainer.style.display = 'block';
        this.canvasContainer.classList.add('link-grabbing');
      });

      return true;
    }
  }

  removeSmallLink({ createSelectionPosition, createMinSize, currentSelectionId, currentSelectionDom, callback }) {
    const { width, height } = createSelectionPosition;

    if (width < createMinSize || height < createMinSize) {
      const currentLinkId = currentSelectionId ||
        (currentSelectionDom && currentSelectionDom.getAttribute('data-id'));

      if (currentLinkId) {
        callback(currentLinkId);
      }

      // this.linksDom.removeChild(this.currentSelectionDom);

      return true;
    }
  }

  recordLinkState({ currentSelectionId, selection, resizeDirectionInfo, callback }) {
    const currentSelection = selection[currentSelectionId];
    if (!(resizeDirectionInfo || {}).direction || !currentSelection) return;

    const axis = computedXandY(resizeDirectionInfo.direction, this.imgContainer, currentSelection);
    selection[currentSelectionId] = {
      ...currentSelection,
      ...axis,
    };

    callback(selection, currentSelectionId, currentSelection);
  }

  resizeLinkUp({ selectionSizeStart }) {
    if (selectionSizeStart) {
      this.recordLinkState(); // 记录最后的状态

      this.syncProperty(() => {
        this.resizeDirectionInfo = {};
        this.selectionSizeStart = false;
        this.currentSelectionDom = undefined;
        this.currentLinkId = undefined;
        this.canvasDom.style.display = 'none';
        this.canvasDom.classList.remove('link-resizing', 'link-resizing-nesw');
      });

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

      this.syncProperty(() => {
        this.createSelectionPosition = {
          x: undefined,
          y: undefined,
          width: undefined,
          height: undefined,
          startX: undefined,
          startY: undefined,
        };
      })


      this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);
      this.currentLinkId = undefined;

      return true;
    }
  }

  createLinkDown(value, linksClassName) {
    setOffsetStyle(this.canvasDom, this.imgContainer, this.offsetSize, false);

    const { target, clientX, clientY, offsetX, offsetY  } = value || {};

    if (value.target.classList.contains(linksClassName)) {
      this.syncProperty(() => {
        this.moveStart = true;
        this.createSelectionPosition.x = offsetX;
        this.createSelectionPosition.y = offsetY;

        this.createSelectionPosition.startX = offsetX;
        this.createSelectionPosition.startY = offsetY;

        this.canvasDom.style.display = 'block';
      });

      return true;
    }
  }

  resizeLinkDown(value) {
    setOffsetStyle(this.canvasDom, this.imgContainer, this.offsetSize, true);
    const { target } = value || {};
    if (target.classList.contains('link-resize')) {
      const [, direction] = target.className.split(' ').find(v => ~v.indexOf('link-direction')).split('link-direction-');
      this.currentSelectionDom = target.parentNode.parentNode;
      this.currentLinkId = this.currentLinkId || this.currentSelectionDom.getAttribute('data-id');
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
          setLinkStyle(this.currentSelectionDom, mergePosition, true);
          break;
        case 'left-bottom':
          mergePosition = {
            right: this.resizeDirectionInfo.rightTopX,
            top: this.resizeDirectionInfo.rightTopY,
          };
          setLinkStyle(this.currentSelectionDom, mergePosition, true)
          break;
        case 'right-bottom':
          mergePosition = {
            left: this.resizeDirectionInfo.leftTopX,
            top: this.resizeDirectionInfo.leftTopY,
          };
          setLinkStyle(this.currentSelectionDom, mergePosition, true);
          break;
      }

      this.links[this.currentLinkId] = {
        ...this.links[this.currentLinkId],
        ...mergePosition,
      }

      this.linkChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);

      this.selectionSizeStart = true;
      this.canvasDom.style.display = 'block';
      this.canvasDom.classList.add(direction === 'left-bottom' ? 'link-resizing-nesw' : 'link-resizing');

      return true;
    }
  }

  setLinkPositionUp({ selectionMoveStart, currentLinkId, links, }) {
    if (selectionMoveStart) {
      const id = this.currentLinkId;
      if (id && this.links[id]) {
        const { lastX, lastY } = this.links[id] || {};
        this.links[id].x = lastX;
        this.links[id].y = lastY;
        this.linkChange(this.links, id, {x: lastX, y: lastY});
      }
      this.useDomSetLinksInfo(this.currentSelectionDom);

      this.currentX = undefined;
      this.currentY = undefined;
      this.currentLinkId = undefined;
      this.currentSelectionDom = undefined;
      this.selectionMoveStart = false;
      this.canvasDom.style.display = 'none';
      this.canvasDom.classList.remove('link-grabbing');

      return true;
    }
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
