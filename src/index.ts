// require('dotenv').config();

import * as tf from '@tensorflow/tfjs';
import { makeUI, makeStats } from './ui';
import { Editor } from './editor';

window.onload = async () => {
  const editor = new Editor();
  document.body.appendChild(editor.domElement);

  tf.backend(); // Register backenad
  makeUI();

  const stats = makeStats();

  let t = 0;
  async function main() {
    t += 1;
  }
  async function animate() {
    stats.begin();
    main();
    stats.end();
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  main();
};
