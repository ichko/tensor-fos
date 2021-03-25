import * as tf from '@tensorflow/tfjs';
import { visualize } from './d3-example';

function main() {
  const t = tf.randomUniform([10, 10]);
  t.print();
  debugger;

  visualize();
}

window.onload = () => main();
