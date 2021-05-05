import { Tensor } from '@tensorflow/tfjs-core';
import { NodeEditor, nodeType } from './node-editor';
import * as ml from './ml';
import { SmallMultiplesRenderer } from './tensor-renderer/small-multiples';
import { TfJsVisRenderer } from './tensor-renderer/tfjs-vis';
import * as tf from '@tensorflow/tfjs';
import { memo } from './utils';

const common = [
  nodeType({
    id: 'Mnist',
    outs: ['nextBatch', 'exampleBatch'],
    ctor: async () => {
      const mnist = ml.data.loadMnist();
      const trainDataset = await mnist({ bs: 16 }).iterator();
      const exampleBatch = (await trainDataset.next()).value;

      return {
        compute: async () => ({
          nextBatch: (await trainDataset.next()).value,
          exampleBatch,
        }),
      };
    },
  }),

  nodeType({
    id: 'Select Batch Input',
    ins: ['batch'],
    outs: ['batch.x'],
    ctor: async () => {
      return {
        compute: async ({ batch }: { batch: any }) => ({
          'batch.x': batch.x,
        }),
      };
    },
  }),

  nodeType({
    id: 'MnistClassifier',
    ins: ['optimBatch', 'forwardBatch'],
    outs: ['preds', 'optimStep'],
    ctor: async () => {
      const model = new ml.MnistClassifier.Model();
      model.net.summary();

      return {
        compute: async ({
          forwardBatch,
          optimBatch,
        }: {
          forwardBatch: ml.MnistClassifier.Batch;
          optimBatch: ml.MnistClassifier.Batch;
        }) => {
          return {
            preds: model.forward(forwardBatch.x),
            optimStep: model.optimStep(optimBatch),
          };
        },
      };
    },
  }),

  nodeType({
    id: 'Heatmap',
    ins: ['tensor'],
    ctor: async () => {
      const batchViewRenderer = new SmallMultiplesRenderer(
        {
          nDimsEntity: 2,
          dimDirections: ['horizontal', 'vertical', 'horizontal', 'vertical'],
        },
        () => new TfJsVisRenderer({ type: 'heatmap' })
      );
      let alreadySet = false;

      return {
        domElement: batchViewRenderer.domElement,
        compute: async ({ tensor }: { tensor: Tensor }) => {
          if (alreadySet) return;
          batchViewRenderer.setTensor(tensor.reshape([4, 4, 28, 28]));
          alreadySet = true;
        },
      };
    },
  }),

  nodeType({
    id: 'Barchart',
    ins: ['tensor'],
    ctor: async () => {
      const predViewRenderer = new SmallMultiplesRenderer(
        {
          nDimsEntity: 1,
          dimDirections: ['horizontal', 'vertical', 'horizontal'],
        },
        () => new TfJsVisRenderer({ type: 'barchart' })
      );

      return {
        domElement: predViewRenderer.domElement,
        compute: async ({ tensor }: { tensor: Tensor }) => {
          predViewRenderer.setTensor(tensor.reshape([4, 4, 10]));
        },
      };
    },
  }),

  nodeType({
    id: 'JSON.parse',
    outs: ['value'],
    ctor: async () => {
      const element = document.createElement('input');
      element.value = '[16, 28, 28]';

      return {
        domElement: element,
        compute: async () => ({ value: JSON.parse(element.value) }),
      };
    },
  }),
];

interface Arg {
  name: string;
  type?: 'int' | 'list-int';
  default?: any;
}

interface NodeDef {
  func: any;
  args?: Arg[];
}

function exportTfJsNodes() {
  const objectInputArgDefs: NodeDef[] = [
    {
      func: tf.layers.dense,
      args: [{ name: 'units', type: 'int', default: 10 }],
    },
    {
      func: tf.layers.flatten,
      args: [],
    },
    {
      func: tf.layers.embedding,
      args: [
        { name: 'inputDim', type: 'int', default: 10 },
        { name: 'outputDim', type: 'int', default: 10 },
      ],
    },
  ];
  const sequentialInputArgsDefs: NodeDef[] = [
    {
      func: tf.rand,
      args: [{ name: 'shape', type: 'list-int', default: [3, 5, 5] }],
    },
    {
      func: tf.randomNormal,
      args: [{ name: 'shape', type: 'list-int', default: [3, 5, 5] }],
    },
    {
      func: tf.randomUniform,
      args: [{ name: 'shape', type: 'list-int', default: [3, 5, 5] }],
    },
  ];

  const objectInputArgNodes = objectInputArgDefs.map(def =>
    nodeType({
      id: `tf.layers.${def.func.name}`,
      ins: def.args?.map(arg => arg.name),
      outs: ['layer'],
      ctor: async () => {
        return {
          compute: memo(async (args: any) => {
            const layer = def.func(args);
            return { layer };
          }),
        };
      },
    })
  );

  const sequentialInputArgsNodes = sequentialInputArgsDefs.map(def =>
    nodeType({
      id: `tf.${def.func.name}`,
      ins: def.args?.map(arg => arg.name),
      outs: ['tensor'],
      ctor: async () => {
        return {
          compute: async (args: any) => {
            const tensor = def.func(...Object.values(args));
            return { tensor };
          },
        };
      },
    })
  );

  return [...objectInputArgNodes, ...sequentialInputArgsNodes];
}

export function registerNodeTypes(editor: NodeEditor) {
  const tfjsNodeTypes = exportTfJsNodes();

  [...common, ...tfjsNodeTypes].forEach(nodeType => {
    editor.registerNodeType(nodeType as any);
  });
}

export function loadExampleNodeState(editor: NodeEditor) {
  const mnistNode = editor.addNode({ id: 'Mnist', pos: { x: 10, y: 350 } });
  const vaeNode = editor.addNode({
    id: 'MnistClassifier',
    pos: { x: 200, y: 450 },
  });
  const heatmapNode = editor.addNode({ id: 'Heatmap', pos: { x: 500, y: 20 } });
  const barchartNode = editor.addNode({
    id: 'Barchart',
    pos: { x: 500, y: 500 },
  });

  editor.addConnection(mnistNode, vaeNode, 'nextBatch', 'optimBatch');
  editor.addConnection(mnistNode, vaeNode, 'exampleBatch', 'forwardBatch');
  editor.addConnection(mnistNode, heatmapNode, 'exampleBatch', 'batch');
  editor.addConnection(vaeNode, barchartNode, 'preds', 'tensor');
}
