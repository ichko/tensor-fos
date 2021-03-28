import * as tf from '@tensorflow/tfjs';
import { visualize } from './tensor-vis';
import * as d3 from 'd3';

d3.select('body')
  .append('button')
  .text('Reload')
  .on('click', () => main());

function main() {
  const t = tf.randomUniform([20, 50]);

  visualize(t);
}

window.onload = () => main();
