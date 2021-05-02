// require('dotenv').config();

import { makeStats } from './ui';
import * as ml from './ml';
import * as tf from '@tensorflow/tfjs';
import { QuickSettingsRenderer } from './tensor-renderer/quick-settings';
import { TfJsVisRenderer } from './tensor-renderer/tfjs-vis';
import { SmallMultiplesRenderer } from './tensor-renderer/small-multiples';
import { BaklavaEditor } from './editor/baklava';

window.onload = async () => {
  // const editor = new Editor();
  // document.body.appendChild(editor.domElement);

  // ml.exampleVAE();

  const stats = makeStats();

  document.body.style.margin = '0px';

  const editor = new BaklavaEditor();
  document.body.appendChild(editor.domElement);

  const batchViewRenderer = new SmallMultiplesRenderer(
    {
      nDimsEntity: 2,
      dimDirections: ['horizontal', 'vertical', 'horizontal', 'vertical'],
    },
    () => new TfJsVisRenderer({ type: 'heatmap' })
  );

  const predViewRenderer = new SmallMultiplesRenderer(
    {
      nDimsEntity: 1,
      dimDirections: ['horizontal', 'vertical', 'horizontal'],
    },
    () => new TfJsVisRenderer({ type: 'barchart' })
  );

  editor.registerNodeType({
    name: 'Heatmap',
    ins: [],
    outs: ['return'],
    element: () => batchViewRenderer.domElement,
  });

  editor.registerNodeType({
    name: 'Barchart',
    ins: ['in'],
    outs: [],
    element: () => predViewRenderer.domElement,
  });

  editor.addNode({ name: 'Heatmap', pos: { x: 10, y: 10 } });
  editor.addNode({ name: 'Barchart', pos: { x: 450, y: 10 } });

  // const batchView = new QuickSettingsRenderer({
  //   title: 'batch',
  //   pos: { x: 10, y: 10 },
  //   renderer: batchViewRenderer,
  // }).appendToBody();

  // const predView = new QuickSettingsRenderer({
  //   title: 'preds',
  //   pos: { x: 700, y: 10 },
  //   renderer: predViewRenderer,
  // }).appendToBody();

  // batchView.setTensor(tf.randomUniform([4, 4, 28, 28]), false);
  // predView.setTensor(tf.randomUniform([4, 4, 10]), false);

  const model = new ml.VAE.Model();
  model.net.summary();

  const mnist = ml.data.loadMnist();
  const trainDataset = await mnist({ bs: 16 }).iterator();
  const exampleBatch = (await trainDataset.next()).value;

  console.log({ batch: exampleBatch });
  console.log({ model });
  const y_hat = model.forward(exampleBatch.x);
  y_hat.print();
  console.log(y_hat);

  batchViewRenderer.setTensor(exampleBatch.x.reshape([4, 4, 28, 28]));

  let i = 0;
  const interval = setInterval(async () => {
    stats.begin();
    const examplePreds = model.forward(exampleBatch.x);
    const exampleLoss = tf.metrics
      .categoricalAccuracy(exampleBatch.y, examplePreds)
      .mean()
      .dataSync()[0];

    if (i % 5 === 0) {
      predViewRenderer.setTensor(examplePreds.reshape([4, 4, 10]));
    }

    const batch = (await trainDataset.next()).value;
    const loss = await model.optimStep(batch);

    console.log(i, `loss: ${loss}, acc: ${exampleLoss}`);
    i++;
    stats.end();

    if (i >= 500) {
      clearInterval(interval);
    }
  }, 30);
};
