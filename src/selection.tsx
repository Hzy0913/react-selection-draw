import React from 'react';

interface IAppProps {
  onDelete?: (id) => void | Promise<{}>;
  id: string;
  node: any;
  doDelete: (id) => void;
  selectionRender: (id) => any;
  createOperator?: (id) => React.ReactNode;
}
export default class Selection extends React.Component<IAppProps, any> {
  onDeleteHandle = () => {
    const { onDelete, id, doDelete } = this.props;

    if (onDelete) {
      const result: any = onDelete(id) || {};

      if (result.then) {
        result.then(() => doDelete(id));
      } else {
        doDelete(id);
      }
    } else {
      doDelete(id);
    }
  }

  render() {
    const { node, createOperator, id } = this.props;

    return <div className="selection-item-content" >
      <div className="selection-item-handle">
        {createOperator && createOperator(id)}
        <span
          className="selection-item-operator selection-item-delete"
          onClick={this.onDeleteHandle}
        >X</span>
      </div>
      {node}
      <div className="selection-resize selection-direction-left-top" />
      <div className="selection-resize selection-direction-top" />
      <div className="selection-resize selection-direction-right-top" />
      <div className="selection-resize selection-direction-right" />
      <div className="selection-resize selection-direction-right-bottom" />
      <div className="selection-resize selection-direction-bottom" />
      <div className="selection-resize selection-direction-left-bottom" />
      <div className="selection-resize selection-direction-left" />
    </div>;
  }
}
