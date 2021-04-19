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
  constructor(props) {
    super(props);
  }

  public render(): JSX.Element {
    return (
      <div className="arc-progress-container">
        <SelectionCreator />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
