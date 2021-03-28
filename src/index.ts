import * as tf from '@tensorflow/tfjs';
import { Heatmap2DVisualizer } from './tensor-vis';
import * as d3 from 'd3';

window.onload = () => {
  d3.select('body')
    .append('button')
    .text('Reload')
    .on('click', () => main());

  const t = tf.randomUniform([100, 100]);
  const vis = new Heatmap2DVisualizer(t);

  const canvas = vis.getHTMLElement();
  document.body.append(canvas);

  function main() {
    const t = tf.randomUniform([100, 100]);
    vis.setTensor(t);
  }
};
