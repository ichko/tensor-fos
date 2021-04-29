// require('dotenv').config();

import { makeStats } from './ui';
import { Editor } from './editor';
import * as ml from './ml';
import * as tf from '@tensorflow/tfjs';
import { QuickSettingsRenderer } from './tensor-renderer/quick-settings';
import { TfJsVisRenderer } from './tensor-renderer/tfjs-vis';
import { SmallMultiplesRenderer } from './tensor-renderer/small-multiples';

window.onload = async () => {
  // const editor = new Editor();
  // document.body.appendChild(editor.domElement);

  // ml.exampleVAE();

  const stats = makeStats();

  const batchView = new QuickSettingsRenderer({
    title: 'batch',
    pos: { x: 10, y: 10 },
    renderer: new SmallMultiplesRenderer(
      {
        nDimsEntity: 2,
        dimDirections: ['horizontal', 'vertical', 'horizontal', 'vertical'],
      },
      () => new TfJsVisRenderer({ type: 'heatmap' })
    ),
  }).appendToBody();

  const predView = new QuickSettingsRenderer({
    title: 'preds',
    pos: { x: 700, y: 10 },
    renderer: new SmallMultiplesRenderer(
      {
        nDimsEntity: 1,
        dimDirections: ['horizontal', 'vertical', 'horizontal'],
      },
      () => new TfJsVisRenderer({ type: 'barchart' })
    ),
  }).appendToBody();

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

  batchView.setTensor(exampleBatch.x.reshape([4, 4, 28, 28]), false);

  let i = 0;
  setInterval(async () => {
    const examplePreds = model.forward(exampleBatch.x);
    const exampleLoss = tf.metrics
      .categoricalAccuracy(exampleBatch.y, examplePreds)
      .mean()
      .dataSync()[0];

    if (i % 10 === 0) {
      predView.setTensor(examplePreds.reshape([4, 4, 10]), false);
    }

    const batch = (await trainDataset.next()).value;
    const loss = await model.optimStep(batch);

    console.log(i, `loss: ${loss}, acc: ${exampleLoss}`);
    i++;
  }, 30);
};
