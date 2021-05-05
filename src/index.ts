// require('dotenv').config();

import { makeStats } from './ui';
import * as tf from '@tensorflow/tfjs';
import { TfJsVisRenderer } from './tensor-renderer/tfjs-vis';
import { SmallMultiplesRenderer } from './tensor-renderer/small-multiples';
import { NodeEditor, nodeType } from './node-editor';
import { Tensor } from '@tensorflow/tfjs';

window.onload = async () => {
  const stats = makeStats();

  document.body.style.margin = '0px';

  const editor = new NodeEditor();
  document.body.appendChild(editor.domElement);

  editor.resolve();

  function loop() {
    stats.begin();
    stats.end();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
};
