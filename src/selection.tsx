import React from 'react';

interface IAppProps {
  onDelete?: (id) => void | Promise<{}>;
  id: string;
  doDelete: (id) => void;
}
interface IAppState {

}
export default class Selection extends React.Component<IAppProps, IAppState> {
  onDeleteHandle = () => {
    const { onDelete, id, doDelete } = this.props;

    if (onDelete) {
      const result: any = onDelete(id) || {};
      console.log(onDelete, 'onDeleteonDeleteonDelete')

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
    return <div className="selection-item-content" >
      <div className="selection-item-handle">
        <span
          className="selection-item-delete"
          onClick={this.onDeleteHandle}
        >删除</span>
      </div>
      <div className="selection-resize selection-direction-left-top" />
      <div className="selection-resize selection-direction-top" />
      <div className="selection-resize selection-direction-right-top" />
      <div className="selection-resize selection-direction-right" />
      <div className="selection-resize selection-direction-right-bottom" />
      <div className="selection-resize selection-direction-bottom" />
      <div className="selection-resize selection-direction-left-bottom" />
      <div className="selection-resize selection-direction-left" />
      {/*<div className="selection-node selection-usable-dnd" >{(link || {}).text}</div>*/}
    </div>;
  }
}
