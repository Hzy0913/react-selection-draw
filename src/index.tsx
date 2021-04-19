import React from 'react';
import Events from './events';
import Controller from './controller-2';
import './style.css';

// interface IAppProps {
//
// }
// interface IAppState {
//
// }
export default class SelectionCreator extends React.Component<any, any> {
  selectionRef;
  controller: Controller;
  events;
  selections;

  // currentSelectionId;
  // currentSelectionDom;
  //
  // selectionDom;
  // canvasDom: HTMLElement;
  // selectionsContainer;
  // imgElement;
  //
  //
  // linksContainer;
  //
  // onDelete;
  // linksChange;
  // linkOnClick;
  // linkOnDblclick;
  // selectOnChange;
  // hooks: any = {};
  // linksDom: HTMLElement;
  // operationDom: HTMLElement;
  //
  // mousedownObservable;
  // mouseMoveObservable;
  // mouseLeaveObservable;
  // mouseUpObservable;
  // linkClickObservable;
  //
  // createMinSize: number = 10;
  // offsetSize: number = 0;
  //
  // mousedownTimeStamp: number;
  // mousedownTimeStampSecond: number;
  // eventTarget: any;
  //
  // links: any;
  // imgContainer = {
  //   width: undefined,
  //   height: undefined,
  // };
  //
  // currentLinkId; // 当前热区id
  // currentSelectionDom: HTMLElement; // 当前热区dom currentLinkDom
  //
  // moveStart: boolean = false; // 开始绘制热区移动
  // createSelectionPosition = { // createLinkPosition
  //   x: undefined,
  //   y: undefined,
  //   width: undefined,
  //   height: undefined,
  //   startX: undefined,
  //   startY: undefined,
  // };
  //
  // selectionMoveStart;  // 开始拖拽热区移动 linkMoveStart
  // currentX; // 当前热区移动X
  // currentY;
  // offsetX;  // 当前热区移动X偏移量
  // offsetY;
  //
  // selectionSizeStart; // 开始重置热区大小 linkSizeStart
  // resizeDirectionInfo; // 调整方向信息

  constructor(props) {
    super(props);

    this.events = new Events();
    this.controller = new Controller();
  }

  componentDidMount() {
    const selectionsDom = this.selectionRef.querySelector('.selection-creator-selections-container');
    const canvasDom = this.selectionRef.querySelector('.selection-creator-canvas-container');
    this.controller.bindElementRef({ selectionsDom, canvasDom });

    this.events.listener('mouseleave', this.selectionRef, this.mouseLeaveSubscriber, 'canvas-mouseleave');
    this.events.listener('mousedown', selectionsDom, this.mousedownSubscriber, 'links-mousedown');
    this.events.listener('mousemove', canvasDom, this.mouseMoveObservable, 'canvas-mousemove');
    this.events.listener('mouseup', canvasDom, this.mouseUpSubscriber, 'canvas-mouseup');
    this.events.listener('click', selectionsDom, this.linkClickSubscriber, 'links-click');
  }

  mousedownSubscriber = (event) => {
    // if (this.mousedownTimeStamp) {
    //   this.mousedownTimeStampSecond = +new Date;
    // } else {
    //   this.mousedownTimeStamp = +new Date;
    // }
    //
    // setTimeout(() => {
    //   this.mousedownTimeStamp = 0;
    //   this.mousedownTimeStampSecond = 0;
    // }, 300);
    //
    // this.eventTarget = target;
    // this.selectionDomClickTrigger(target);

    if (this.controller.setLinkPositionDown(event)) return;

    if (this.controller.createLinkDown(event)) return;

    if (this.controller.resizeLinkDown(event)) return;
  }

  mouseMoveSubscriber(target) {
    if (this.controller.setLinkPositionMove(target)) return;

    if (this.controller.resizeLinkMove(target)) return;

    if (this.controller.createLinkMove(target)) return;
  }

  selectionChange(...args) {
    const { selectionChange: propSelectionChange } = this.props;
    propSelectionChange && propSelectionChange(...args);
  }

  mouseLeaveSubscriber = (target) => {
    this.controller.removeSmallLink();
    this.controller.recordSelectionstate();

    // this.selectionChange(this.links, this.currentLinkId, this.links[this.currentLinkId]);

    this.controller.resetSelectioContext();
  }

  mouseMoveObservable = (event) => {
    if (this.controller.setLinkPositionMove(event)) return;

    if (this.controller.resizeLinkMove(event)) return;

    if (this.controller.createLinkMove(event)) return;
  }

  syncProperty(callback) {
    callback();
  }

  linkDomDblclickTrigger(target) {

  }

  selectionDomClickTrigger(...args) {
    const { selectionOnClick } = this.props;
    selectionOnClick && selectionOnClick(...args);
  }

  mouseUpSubscriber = (target) => {
    // const currentTimeStamp = +new Date;
    // if (this.mousedownTimeStampSecond) {
    //   this.linkDomDblclickTrigger(this.eventTarget);
    //   this.eventTarget = undefined;
    // } else if (currentTimeStamp - this.mousedownTimeStamp < 120) {
    //   this.selectionDomClickTrigger(this.eventTarget);
    //   this.eventTarget = undefined;
    // }

    if (this.controller.setLinkPositionUp(target)) return;

    if (this.controller.resizeLinkUp(target)) return;

    if (this.controller.createLinkUp(target)) return;
  }

  linkClickSubscriber = (event) => {
    const { target } = event;
    if (!~target.classList.contains('image-map-link')) return;

    // this.currentSelectionDom = undefined;
    // this.selectionMoveStart = false;
    // this.canvasContainer.style.display = 'none';
    // this.currentLinkId = undefined;
  }

  render() {
    return <div
      className="selection-creator-container"
      ref={ref => this.selectionRef = ref}
      style={{ width: 400, height: 400 }}
    >
      <div className="selection-creator-canvas-container" />
      <div className="selection-creator-selections-container" />
      <img
        className="selection-creator-background-img"
        // style={{display: previewImage || image ? 'block' : 'none'}}
      />
    </div>;
  }
}
