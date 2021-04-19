import React from 'react';
import ReactDOM from 'react-dom';
import { FlumeEditor } from './flume';

export class Editor {
  public domElement: HTMLElement;

  constructor() {
    const container = document.createElement('div');

    const flumeInstance = (
      <FlumeEditor
        provideRef={(ref: any) => {
          const nodes = ref.getNodes();

          console.log(nodes);
        }}
      />
    );

    ReactDOM.render(flumeInstance, container);
    this.domElement = container.firstChild! as HTMLElement;
  }
}
