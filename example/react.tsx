import React from 'react';
import ReactDOM from 'react-dom';
import SelectionCreator from '../src';

interface IAppProps {}
interface IAppState {
  progress: number;
  text: string;
  progress3: number;
  progress4: number;
  text4: string;
  customText: any;
}

class App extends React.Component<IAppProps, IAppState> {
  action;

  constructor(props) {
    super(props);
  }

  handle = () => {
    console.log(this.action.selectionAction({
      type: 'add',
      content: {
        height: 145,
        width: 112,
        x: 248,
        y: 101,
        node: <h1>1123</h1>
      }
    }), 123123)
  }

  public render(): JSX.Element {
    return (
      <div className="arc-progress-container">
        <button onClick={this.handle}>点击</button>
        <SelectionCreator
          // minWidth={100}
          // minHeight={20}
          ref={ref => this.action = ref}
          createOperator={(v) => <span onClick={() => console.log(v)}>{1}</span>}
          selectionChange={(v, a, id) => {
            console.log(v, id, a)
          }}
          onDelete={() => {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(111)
              }, 1)
            })
          }}
        >
          <div style={{ position: 'relative', zIndex: 999 }}>
            <h1>12312</h1>
            <h1>12312</h1>
            <h1>12312</h1>
          </div>
        </SelectionCreator>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
