import * as tf from '@tensorflow/tfjs';
import { MNISTDataset } from 'tfjs-data-mnist';

import { makeUI, makeStats } from './ui';

window.onload = async () => {
  makeUI();
  tf.backend(); // Register backend

  const stats = makeStats();

  let t = 0;
  async function main() {
    t += 1;
  }

  async function animate() {
    stats.begin();
    // main();
    stats.end();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  main();
};
