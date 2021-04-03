import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { MNISTDataset } from 'tfjs-data-mnist';
import Stats from 'stats.js';

import { Tensor } from '@tensorflow/tfjs';
import { InteractiveTensor } from './interactive-tensor';

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

  const shape = [2, 3, 3, 3, 28, 28];
  const t = tf.randomUniform(shape);
  const vis = new InteractiveTensor(t.shape);

  async function main() {
    // const dataElement = await dl.next();
    // let tensor = dataElement.value as tf.Tensor;

    const t = tf.randomUniform(shape);
    vis.setTensor(t);
  }

  async function animate() {
    stats.begin();

    stats.end();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  main();
};
