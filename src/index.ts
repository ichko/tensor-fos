import * as tf from '@tensorflow/tfjs';
import { NDTensorHeatmapVisualizer } from './visualizers';
import * as d3 from 'd3';

window.onload = () => {
  d3.select('body')
    .append('button')
    .text('Reload')
    .on('click', () => main());

  const shape = [3, 2, 2, 3, 10, 10];
  const t = tf.randomUniform(shape);
  const vis = new NDTensorHeatmapVisualizer({
    pixelSize: 10,
    tensorShape: t.shape,
    outerPadding: 5,
  });

  const canvas = vis.getHTMLElement();
  document.body.append(canvas);

  function main() {
    const t = tf.randomNormal(shape);
    vis.setTensor(t);
  }

  main();
};
