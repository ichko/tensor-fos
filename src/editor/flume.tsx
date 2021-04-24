import { FlumeConfig, Controls, Colors } from 'flume';
import ReactDOM from 'react-dom';
import React, { useEffect, useRef } from 'react';
import { NodeEditor } from 'flume';

interface Props {
  provideRef: (ref: any) => void;
}

export const FlumeEditorComponent = ({ provideRef }: Props) => {
  const flumeConfig = new FlumeConfig()
    .addPortType({
      type: 'number',
      name: 'number',
      label: 'Number',
      color: Colors.red,
      controls: [
        Controls.number({
          name: 'num',
          label: 'Number',
        }),
      ],
    })
    .addNodeType({
      type: 'number',
      label: 'Number',
      initialWidth: 150,
      inputs: (ports: any) => [ports.number()],
      outputs: (ports: any) => [ports.number()],
    })
    .addNodeType({
      type: 'addNumbers',
      label: 'Add Numbers',
      initialWidth: 150,
      inputs: (ports: any) => [
        ports.number({ name: 'num1' }),
        ports.number({ name: 'num2' }),
      ],
      outputs: (ports: any) => [ports.number({ name: 'result' })],
    })
    .addRootNodeType({
      type: 'homepage',
      label: 'Homepage',
      initialWidth: 170,
      inputs: (ports: any) => [
        ports.number({
          name: 'title',
          label: 'Title',
        }),
        ports.number({
          name: 'description',
          label: 'Description',
        }),
        ports.number({
          name: 'showSignup',
          label: 'Show Signup',
        }),
        ports.number({
          name: 'copyrightYear',
          label: 'Copyright Year',
        }),
      ],
    });

  const nodeEditor = useRef();

  useEffect(() => {
    provideRef(nodeEditor.current);
  });

  return (
    <div
      style={{
        width: 1400,
        height: 900,
        border: '2px solid black',
        margin: '0 auto',
      }}
    >
      <NodeEditor
        nodeTypes={flumeConfig.nodeTypes}
        portTypes={flumeConfig.portTypes}
        ref={nodeEditor}
        defaultNodes={[
          {
            type: 'homepage',
            x: 190,
            y: -150,
          },
        ]}
      />
    </div>
  );
};

function injectCSS() {
  const css = `
    .Stage_wrapper__1X5K_ {
      background-color: grey;
      background-image: linear-gradient(
        0deg,
        transparent 24%,
        rgba(0, 0, 0, 0.2) 25%,
        rgba(0, 0, 0, 0.2) 26%,
        transparent 27%,
        transparent 74%,
        rgba(0, 0, 0, 0.2) 75%,
        rgba(0, 0, 0, 0.2) 76%,
        transparent 77%,
        transparent
      ),
      linear-gradient(
        90deg,
        transparent 24%,
        rgba(0, 0, 0, 0.2) 25%,
        rgba(0, 0, 0, 0.2) 26%,
        transparent 27%,
        transparent 74%,
        rgba(0, 0, 0, 0.2) 75%,
        rgba(0, 0, 0, 0.2) 76%,
        transparent 77%,
        transparent
      );
    }

    .Stage_wrapper__1X5K_ textarea {
      background: white;
      border-color: #ccc;
    }

    .Node_wrapper__3SmT7 {
      background: white;
    }

    .Node_label__3MmhF {
      background: white;
    }

    .Select_selectedWrapper__SUs4D {
      background: white;
      border-color: #ccc;
    }
  `;

  const container = document.createElement('style');
  container.innerText = css;

  document.body.appendChild(container);
}

let cssAlreadyInjected = false;

export const editorInstance = () => {
  if (!cssAlreadyInjected) {
    injectCSS();
    cssAlreadyInjected = true;
  }

  const container = document.createElement('div');
  let localRef: any = undefined;

  const flumeInstance = (
    <FlumeEditorComponent
      provideRef={(ref: any) => {
        localRef = ref;
      }}
    />
  );

  ReactDOM.render(flumeInstance, container);

  return {
    dom: container.firstChild! as HTMLElement,
    ref: localRef,
  };
};
