import { Tensor } from '@tensorflow/tfjs-core';
import { Editor, nodeType } from './editor';
import * as ml from './ml';
import { SmallMultiplesRenderer } from './tensor-renderer/small-multiples';
import { TfJsVisRenderer } from './tensor-renderer/tfjs-vis';

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
    ins: ['batch'],
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
        compute: async ({ batch }: { batch: ml.MnistClassifier.Batch }) => {
          if (alreadySet) return;
          batchViewRenderer.setTensor(batch.x.reshape([4, 4, 28, 28]));
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
];

export function registerNodeTypes(editor: Editor) {
  common.forEach(nodeType => {
    editor.registerNodeType(nodeType as any);
  });
}

export function loadExampleNodeState(editor: Editor) {
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
