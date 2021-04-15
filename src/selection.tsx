import React from 'react';

interface IAppProps {

}
interface IAppState {

}
export default class Selection extends React.Component<IAppProps, IAppState> {

  render() {
    return <div className="selection-item-content" >
      <div
        className="selection-item-delete"
        // onClick={(e) => this.onDelete && this.onDelete(id)}
      >
        删除
      </div>
      <div className="selection-resize selection-direction-left-top" />
      <div className="selection-resize selection-direction-top" />
      <div className="selection-resize selection-direction-right-top" />
      <div className="selection-resize selection-direction-right" />
      <div className="selection-resize selection-direction-right-bottom" />
      <div className="selection-resize selection-direction-bottom" />
      <div className="selection-resize selection-direction-left-bottom" />
      <div className="selection-resize selection-direction-left" />
      {/*<div className="selection-node link-usable-dnd" >{(link || {}).text}</div>*/}
    </div>;
  }
}
