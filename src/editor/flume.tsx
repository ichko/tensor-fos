import { FlumeConfig, Controls, Colors } from 'flume';
import ReactDOM from 'react-dom';
import React, { useEffect, useRef } from 'react';

import { NodeEditor } from 'flume';

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

interface Props {
  provideRef: (ref: any) => void;
}

export const FlumeEditor = ({ provideRef }: Props) => {
  const nodeEditor = useRef();

  useEffect(() => {
    provideRef(nodeEditor.current);
  });

  return (
    <div style={{ width: 800, height: 800 }}>
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
