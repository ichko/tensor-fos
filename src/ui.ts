import * as tf from '@tensorflow/tfjs';

import QuickSettings, { AnyModel, QuickSettingsPanel } from 'quicksettings';
import Stats from 'stats.js';
import { QuickSettingsWidgetUI } from './widget-ui';
import {
  D3fcSeriesRenderer,
  D3fcSeriesType,
  D3fcRenderType,
} from './tensor-renderer/d3fc-series';
import { TfJsVisRenderer } from './tensor-renderer/tfjs-vis-renderert';
import { SmallMultiplesRenderer } from './tensor-renderer/small-multiples';
import { reshape, Variable } from '@tensorflow/tfjs';
import * as ml from './ml';

export function makeStats() {
  const stats = new Stats();
  stats.dom.style.cssText =
    'position:fixed;top:5px;right:5px;opacity:0.9;z-index:10000';
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  return stats;
}

function createDefaultTensorVisUI(x: number, y: number, tensor: Variable) {
  const vis = new SmallMultiplesRenderer(
    { nDimsEntity: 2 },
    () => new TfJsVisRenderer({ type: 'barchart' })
    // new D3fcSeriesRenderer({
    //   renderer: 'canvas',
    //   type: 'heatmap',
    //   width: 100,
    //   height: 100,
    //   crossIndex: 'consecutive',
    // })
    // new UPlotVisualizer({
    //   renderer: 'canvas',
    //   type: 'heatmap',
    //   width: 200,
    //   height: 200,
    // })
  );

  let shape: number[] = tensor.shape;
  let playAnim = false;

  const ui = new QuickSettingsWidgetUI({
    pos: { x, y },
    title: 'd3fc tensor',
    widgets: [{ type: 'element', element: vis.domElement }],
  });

  document.body.appendChild(ui.domElement);
  vis.setTensor(tensor);

  async function animate() {
    if (playAnim) {
      vis.setTensor(tensor);
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

const setRandom = (tensor: Variable) => {
  const newValue = tf.randomNormal(tensor.shape);
  tensor.assign(newValue);
};

const setSin = (tensor: Variable, t: number = 0) => {
  tf.tidy(() => {
    const numUnits = [1, ...tensor.shape].reduce((a, b) => a * b);
    const newValue = tf.sin(
      tf
        .range(0, numUnits, 1)
        .div(tensor.shape.length * 100)
        .add(t / 10)
        .reshape(tensor.shape)
    );

    tensor.assign(newValue);
  });
};

export function makeUI() {
  let menu: QuickSettingsPanel<AnyModel, string> | undefined = undefined;

  const shape = [2, 2, 32, 32];
  const v = tf.variable(tf.ones(shape));

  let t = 0;

  async function animate() {
    t += 1;
    setSin(v, t);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // createDefaultTensorVisUI(400, 20, v);

  window.document.body.ondblclick = (e: MouseEvent) => {
    if (e.target !== document.body) return;

    menu = QuickSettings.create(e.clientX, e.clientY, 'Menu');
    menu.addButton('Create Normal Tensor', async () => {
      const mnist = ml.data.loadMnist();
      const trainDataset = await mnist({ bs: 16 }).iterator();
      const batch = await trainDataset.next();
      const reshaped = batch.value.x.reshape([4, 4, 28, 28]);

      createDefaultTensorVisUI(e.clientX - 300, e.clientY - 500, reshaped);
    });
  };

  window.document.body.onclick = () => {
    menu?.destroy();
    menu = undefined;
  };
}
