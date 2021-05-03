// require('dotenv').config();

import { makeStats } from './ui';
import * as ml from './ml';
import * as tf from '@tensorflow/tfjs';
import { QuickSettingsRenderer } from './tensor-renderer/quick-settings';
import { TfJsVisRenderer } from './tensor-renderer/tfjs-vis';
import { SmallMultiplesRenderer } from './tensor-renderer/small-multiples';
import { BaklavaEditor, nodeType } from './editor';
import { LazyIterator } from '@tensorflow/tfjs-data/dist/iterators/lazy_iterator';
import { conv2dTranspose, Tensor } from '@tensorflow/tfjs';

const MnistDatasetNodeType = nodeType({
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
});

const VAEModelNodeType = nodeType({
  id: 'VAE',
  ins: ['optimBatch', 'forwardBatch'],
  outs: ['preds', 'optimStep'],
  ctor: async () => {
    const model = new ml.VAE.Model();
    model.net.summary();

    return {
      compute: async ({
        forwardBatch,
        optimBatch,
      }: {
        forwardBatch: ml.VAE.Batch;
        optimBatch: ml.VAE.Batch;
      }) => ({
        preds: model.forward(forwardBatch.x),
        optimStep: model.optimStep(optimBatch),
      }),
    };
  },
});

const HeapmapNodeType = nodeType({
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

    return {
      domElement: batchViewRenderer.domElement,
      compute: async ({ tensor }: { tensor: Tensor }) => {
        batchViewRenderer.setTensor(tensor.reshape([4, 4, 28, 28]));
      },
    };
  },
});

const BarchartNodeType = nodeType({
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
});

window.onload = async () => {
  const stats = makeStats();

  document.body.style.margin = '0px';

  const editor = new BaklavaEditor();
  document.body.appendChild(editor.domElement);

  editor.registerNodeType(MnistDatasetNodeType);
  editor.registerNodeType(VAEModelNodeType);
  editor.registerNodeType(HeapmapNodeType);
  editor.registerNodeType(BarchartNodeType);

  const mnistNode = editor.addNode({ id: 'Mnist', pos: { x: 10, y: 50 } });
  const vaeNode = editor.addNode({ id: 'VAE', pos: { x: 200, y: 150 } });
  const heatmapNode = editor.addNode({ id: 'Heatmap', pos: { x: 500, y: 20 } });
  const barchartNode = editor.addNode({
    id: 'Barchart',
    pos: { x: 500, y: 350 },
  });

  editor.addConnection(mnistNode, vaeNode, 'nextBatch', 'optimBatch');
  editor.addConnection(mnistNode, vaeNode, 'exampleBatch', 'forwardBatch');
  editor.addConnection(mnistNode, heatmapNode, 'exampleBatch', 'tensor');
  editor.addConnection(vaeNode, barchartNode, 'preds', 'tensor');

  editor.resolve(barchartNode);

  // let i = 0;
  // const interval = setInterval(async () => {
  //   stats.begin();

  //   if (i % 5 === 0) {
  //   }

  //   const loss = await model.optimStep(batch);

  //   console.log(i, `loss: ${loss}, acc: ${exampleLoss}`);
  //   i++;
  //   stats.end();

  //   if (i >= 500) {
  //     clearInterval(interval);
  //   }
  // }, 30);
};
