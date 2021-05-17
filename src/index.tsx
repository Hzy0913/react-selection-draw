import React from 'react';
import Events from './events';
import Controller from './controller';
import { delay, getDataId, queryParentDataIdByDom, classNames } from './utils';
import { UpdateSelection, ReactSelectionDrawProps } from './declare';
import './style.css';

export default class SelectionDraw extends React.Component<ReactSelectionDrawProps, any> {
  static defaultProps = {
    offset: 50,
    width: 400,
    height: 400,
  };

  selectionRef;
  controller: Controller;
  events;
  selections;
  mousedownTimeStamp: number;
  eventTarget: any;

  constructor(props) {
    super(props);

    const { onDelete, selectionRender, selectionChange, offset, width, height } = props;

    this.events = new Events();
    this.controller = new Controller({
      width,
      height,
      offset,
      onDelete,
      selectionRender,
      selectionChange: selectionChange || (() => void 0),
    });
  }

  updateSelection(options: UpdateSelection) {
    this.controller.updateSelection(options);
  }

  componentDidMount() {
    const selectionRef = this.selectionRef;

    const selectionsDom = selectionRef.querySelector('.selection-creator-selections-container');
    const canvasDom = selectionRef.querySelector('.selection-creator-canvas-container');

    this.controller.bindElementRef({ selectionsDom, canvasDom });

    this.events.listener('mouseleave', selectionRef, this.mouseLeave, 'canvas-mouseleave');
    this.events.listener('mousedown', selectionsDom, this.mousedown, 'selections-mousedown');
    this.events.listener('mousemove', canvasDom, this.mouseMove, 'canvas-mousemove');
    this.events.listener('mouseup', canvasDom, this.mouseUp, 'canvas-mouseup');
    this.events.listener('click', selectionsDom, this.selectionClick, 'selections-click');
  }

  mousedown = (event) => {
    this.eventTarget = event.target;
    this.mousedownTimeStamp = +new Date;
    delay(300).then(() => this.mousedownTimeStamp = 0);

    if (this.controller.setSelectionPositionDown(event)) return;

    if (this.controller.createSelectionDown(event)) return;

    if (this.controller.resizeSelectionDown(event)) return;
  }

  selectionChange = (type, selections, id) => {
    const { selectionChange: propSelectionChange } = this.props;
    propSelectionChange && propSelectionChange(type, selections, id);
  }

  mouseLeave = (target) => {
    this.controller.removeSmallSelection();
    this.controller.recordSelectionState();
    this.controller.resetSelectionContext();
  }

  mouseMove = (event) => {
    if (this.controller.setSelectionPositionMove(event)) return;

    if (this.controller.resizeSelectionMove(event)) return;

    if (this.controller.createSelectionMove(event)) return;
  }

  selectionDomClickTrigger(target?) {
    const { selectionOnClick } = this.props;
    const currentTimeStamp = +new Date;
    const selectedNode = this.selectionRef.querySelector('.selection-node-selected');
    let dataId;

    if (this.eventTarget && currentTimeStamp - this.mousedownTimeStamp < 200
      && this.eventTarget.classList.contains('selection-node')
    ) {
      selectedNode && selectedNode.classList.remove('selection-node-selected');
      dataId = getDataId(this.eventTarget);
      this.eventTarget.classList.add('selection-node-selected');
      selectionOnClick && selectionOnClick(dataId, this.eventTarget);
      return this.eventTarget = undefined;
    }

    if (target) {
      selectedNode && selectedNode.classList.remove('selection-node-selected');
      const [id, targetDom] = queryParentDataIdByDom(target);
      dataId = id;
      targetDom.classList.add('selection-node-selected');
      selectionOnClick && selectionOnClick(dataId, targetDom);
    }
  }

  mouseUp = (target) => {
    this.selectionDomClickTrigger();

    if (this.controller.setSelectionPositionUp(target)) return;

    if (this.controller.resizeSelectionUp(target)) return;

    if (this.controller.createSelectionUp(target)) return;
  }

  selectionClick = (event) => {
    const { target } = event;
    if (target.classList.contains('selection-item-operator')) return;

    this.selectionDomClickTrigger(target);
  }

  render() {
    const { className = '', width = 400, height = 400 } = this.props;
    return <div
      className={classNames(`selection-creator-container ${className}`)}
      ref={ref => this.selectionRef = ref}
      style={{ width, height }}
    >
      <div className="selection-creator-canvas-container" />
      <div className="selection-creator-selections-container" />
    </div>;
  }
}
