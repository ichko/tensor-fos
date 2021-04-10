import { randomNormal } from '@tensorflow/tfjs-core';
import * as tf from '@tensorflow/tfjs';

import QuickSettings, { AnyModel, QuickSettingsPanel } from 'quicksettings';
import Stats from 'stats.js';
import { InteractiveUI } from './interactive-ui';
import {
  D3fcSeriesVisualizer,
  SeriesType,
  RenderType,
} from './visualizers/d3fc-series';

export function makeStats() {
  const stats = new Stats();
  stats.dom.style.cssText =
    'position:fixed;top:5px;right:5px;opacity:0.9;z-index:10000';
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  return stats;
}

class D3FCWrapper extends D3fcSeriesVisualizer {
  setSinTensor() {
    const t = 1;
    const tensor = tf.sin(
      tf
        .range(-4, 4, 0.05)
        .add(t / 10)
        .reshape([2, 2, 40])
    );
    this.setTensor(tensor);
  }
  setNormalTensor() {
    const shape = [2, 2, 10, 10];
    const tensor = randomNormal(shape);
    this.setTensor(tensor);
  }

  setType(type: SeriesType) {
    super.set({ type: type });
  }

  setRenderer(renderer: RenderType) {
    super.set({ renderer: renderer });
  }
}

export function makeMenu() {
  let menu: QuickSettingsPanel<AnyModel, string> | undefined = undefined;

  window.document.body.ondblclick = (e: MouseEvent) => {
    if (e.target !== document.body) return;

    menu = QuickSettings.create(e.clientX, e.clientY, 'Menu');
    menu.addButton('Create Normal Tensor', () => {
      const instance = new D3FCWrapper({
        renderer: 'svg',
        type: 'line',
      });

      const ui = new InteractiveUI(
        { x: e.clientX, y: e.clientY },
        {
          ctor: () => instance,
          properties: [
            { accessor: 'domElement', type: 'element' },
            { accessor: 'setNormalTensor', type: 'button' },
            {
              accessor: 'setType',
              type: 'drop-down',
              values: [
                'area',
                'bar',
                'heatmap',
                'line',
                'point',
              ] as SeriesType[],
            },
            {
              accessor: 'setRenderer',
              type: 'drop-down',
              values: ['canvas', 'svg', 'webgl'] as RenderType[],
            },
          ],
        }
      );

      ui.build();
      instance.setNormalTensor();
    });
  };

  window.document.body.onclick = () => {
    menu?.destroy();
    menu = undefined;
  };
}
