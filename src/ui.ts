import * as tf from '@tensorflow/tfjs';

import QuickSettings, { AnyModel, QuickSettingsPanel } from 'quicksettings';
import Stats from 'stats.js';
import { QuickSettingsWidgetUI } from './widget-ui';
import {
  D3fcSeriesVisualizer,
  SeriesType,
  RenderType,
} from './visualizers/d3fc-series';
import { SmallMultiplesVisualizer } from './visualizers/small-multiples';
import { UPlotVisualizer } from './visualizers/uplot-visualizer';

export function makeStats() {
  const stats = new Stats();
  stats.dom.style.cssText =
    'position:fixed;top:5px;right:5px;opacity:0.9;z-index:10000';
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  return stats;
}

function createDefaultTensorVisUI(x: number, y: number) {
  const vis = new SmallMultiplesVisualizer(
    { nDimsEntity: 2 },
    () =>
      new D3fcSeriesVisualizer({
        renderer: 'canvas',
        type: 'heatmap',
        width: 300,
        height: 300,
      })
  );

  let shape: number[] = [2, 2, 32, 32];

  const setTensor = () => {
    const t = tf.randomNormal(shape);
    vis.setTensor(t);
  };

  const ui = new QuickSettingsWidgetUI({
    pos: { x, y },
    title: 'd3fc tensor',
    widgets: [
      { type: 'element', element: vis.domElement },
      {
        type: 'text',
        title: 'shape',
        initial: '2 2 32 32',
        update: val =>
          (shape = val
            .split(' ')
            .map(v => +v)
            .filter(v => v !== 0)),
      },
      {
        type: 'button',
        title: 'randomize',
        update: setTensor,
      },
      {
        type: 'button',
        title: 'sin data',
        update: () => {
          const numUnits = [1, ...shape].reduce((a, b) => a * b);
          const tensor = tf.sin(
            tf
              .range(0, numUnits, 1)
              .div(shape.length * 100)
              .reshape(shape)
          );
          vis.setTensor(tensor);
        },
      },
      {
        type: 'drop-down',
        values: ['heatmap', 'area', 'bar', 'line', 'point'] as SeriesType[],
        update: (type: SeriesType) => vis.setInternal({ type: type }),
      },
      {
        type: 'drop-down',
        values: ['canvas', 'svg', 'webgl'] as RenderType[],
        update: (type: RenderType) => vis.setInternal({ renderer: type }),
      },
      {
        type: 'drop-down',
        values: ['canvas', 'svg', 'webgl'] as RenderType[],
        update: (type: RenderType) => vis.setInternal({ renderer: type }),
      },
      {
        type: 'number',
        title: 'width',
        min: 100,
        max: 500,
        initial: 300,
        step: 1,
        update: (val: number) => vis.setInternal({ width: val }),
      },
      {
        type: 'number',
        title: 'height',
        min: 100,
        max: 500,
        initial: 300,
        step: 1,
        update: (val: number) => vis.setInternal({ height: val }),
      },
      {
        type: 'button',
        title: 'delete',
        update: () => {
          ui.domElement.remove();
        },
      },
    ],
  });

  document.body.appendChild(ui.domElement);
  setTensor();
}

export function makeUI() {
  let menu: QuickSettingsPanel<AnyModel, string> | undefined = undefined;

  const uplotVis = new UPlotVisualizer();

  createDefaultTensorVisUI(20, 20);

  window.document.body.ondblclick = (e: MouseEvent) => {
    if (e.target !== document.body) return;

    menu = QuickSettings.create(e.clientX, e.clientY, 'Menu');
    menu.addButton('Create Normal Tensor', () => {
      createDefaultTensorVisUI(e.clientX - 300, e.clientY - 500);
    });
  };

  window.document.body.onclick = () => {
    menu?.destroy();
    menu = undefined;
  };
}
