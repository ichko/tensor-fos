import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { MNISTDataset } from 'tfjs-data-mnist';
import Stats from 'stats.js';

import { Tensor } from '@tensorflow/tfjs';
import { InteractiveTensor } from './interactive-tensor';
import { LineVisualizer } from './visualizers/line';
import { HeatmapVisualizer } from './visualizers/heatmap';

window.onload = async () => {
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

  const shape = [10, 10, 10];

  const heatmap = new HeatmapVisualizer({ pixelSize: 4 });
  const line = new LineVisualizer({ lineWidth: 1 });

  const interact2 = new InteractiveTensor(heatmap);
  const interact = new InteractiveTensor(line);

  async function main() {
    const t = tf.randomUniform(shape);
    interact.setTensor(t);
    interact2.setTensor(t);
  }

  async function animate() {
    stats.begin();

    stats.end();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  main();
};
