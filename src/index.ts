// require('dotenv').config();

import * as tf from '@tensorflow/tfjs';
import { Editor } from './editor';
import { parallel } from './mp';

import { makeUI, makeStats } from './ui';

// import './rete';

window.onload = async () => {
  const editor = new Editor();
  document.body.appendChild(editor.container);
  editor.addNode('tes');
  editor.addNode('tes2');

  tf.backend(); // Register backend
  // makeUI();

  const p = parallel(() => {});

  p();

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
