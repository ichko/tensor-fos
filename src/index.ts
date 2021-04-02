import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { MNISTDataset } from 'tfjs-data-mnist';
import Stats from 'stats.js';

import { NDTensorHeatmapVisualizer } from './visualizers/NDTensorHeatmapVisualizer';
import { Tensor } from '@tensorflow/tfjs';
import QuickSettings from 'quicksettings';

window.onload = async () => {
  // QuickSettings.useExtStyleSheet();
  const settings = QuickSettings.create(0, 0, 'Tensor');
  settings.setWidth(500);

  const stats = new Stats();
  stats.dom.style.cssText =
    'position:fixed;top:5px;right:5px;opacity:0.9;z-index:10000';
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const dl = await (await MNISTDataset.create()).testDataset
    .batch(100)
    .map(x =>
      x instanceof Tensor
        ? x.slice([0, 1, 0], [-1, 1, -1]).squeeze().reshape(shape)
        : undefined
    )
    .repeat(-1)
    .iterator();

  d3.select('body')
    .append('button')
    .text('Reload')
    .on('click', () => main());

  const shape = [10, 10, 28, 28];
  const t = tf.randomUniform(shape);
  const vis = new NDTensorHeatmapVisualizer({
    pixelSize: 2,
    tensorShape: t.shape,
    outerPadding: 2,
  });

  const canvas = vis.getHTMLElement();
  settings.addElement('', canvas);

  async function main() {
    const dataElement = await dl.next();
    let tensor = dataElement.value as tf.Tensor;
    vis.setTensor(tensor);
  }

  async function animate() {
    stats.begin();

    stats.end();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  main();
};
