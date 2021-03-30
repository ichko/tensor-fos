import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { MNISTDataset } from 'tfjs-data-mnist';

import { NDTensorHeatmapVisualizer } from './visualizers/NDTensorHeatmapVisualizer';

window.onload = async () => {
  const ds = await MNISTDataset.create();

  const it = await ds.testDataset.iterator();

  d3.select('body')
    .append('button')
    .text('Reload')
    .on('click', () => main());

  const shape = [28, 28];
  const t = tf.randomUniform(shape);
  const vis = new NDTensorHeatmapVisualizer({
    pixelSize: 10,
    tensorShape: t.shape,
    outerPadding: 5,
  });

  const canvas = vis.getHTMLElement();
  document.body.append(canvas);

  async function main() {
    const dataElement = await it.next();
    const digit = tf.tensor(dataElement.value[0], [28, 28]);
    vis.setTensor(digit);
  }

  main();
};
