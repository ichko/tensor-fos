import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { MNISTDataset } from 'tfjs-data-mnist';
import Stats from 'stats.js';

import { Tensor } from '@tensorflow/tfjs';
import { InteractiveTensor } from './interactive-tensor';
import { D3fcSeriesVisualizer } from './visualizers/d3fc-series';
import { HeatmapVisualizer } from './visualizers/heatmap';
import { SmallMultiplesVisualizer } from './visualizers/small-multiples';
import QuickSettings, { AnyModel, QuickSettingsPanel } from 'quicksettings';
import { UPlotVisualizer } from './visualizers/uplot-visualizer';

function makeMenu() {
  let menu: QuickSettingsPanel<AnyModel, string> | undefined = undefined;

  window.document.ondblclick = (e: MouseEvent) => {
    console.log(e);

    menu = QuickSettings.create(e.clientX, e.clientY, 'Menu');
    menu.addButton('Create Normal Tensor', () => {
      alert();
    });
  };

  window.document.onclick = () => {
    menu?.destroy();
    menu = undefined;
  };
}

window.onload = async () => {
  makeMenu();
  tf.backend();

  const stats = new Stats();
  stats.dom.style.cssText =
    'position:fixed;top:5px;right:5px;opacity:0.9;z-index:10000';
  stats.showPanel(0);
  document.body.appendChild(stats.dom);

  const uplotVis = new UPlotVisualizer();

  const dl = await (await MNISTDataset.create()).testDataset
    .batch(100)
    .map(x =>
      x instanceof Tensor
        ? x.slice([0, 1, 0], [-1, 1, -1]).squeeze().reshape(shape)
        : undefined
    )
    .repeat(-1)
    .iterator();

  d3.select('body')
    .append('button')
    .text('Reload')
    .on('click', () => main());

  const shape = [3, 10, 10];

  const heatmap = new HeatmapVisualizer({ pixelSize: 4 });
  const line = new D3fcSeriesVisualizer({
    renderer: 'webgl',
    type: 'line',
    style: { size: 2 },
    crossIndex: 'consecutive',
  });
  const multiplies = new SmallMultiplesVisualizer(
    { nDimsEntity: 2, dimDirections: ['horizontal'] },
    () =>
      new D3fcSeriesVisualizer({
        renderer: 'canvas',
        type: 'heatmap',
        style: { size: 2 },
      })
  );

  const interact = new InteractiveTensor(line);
  const interactHeatmap = new InteractiveTensor(heatmap);
  const interactMultiplies = new InteractiveTensor(multiplies);

  let t = 0;
  async function main() {
    t += 1;
    const tensor = tf.sin(
      tf
        .range(-4, 4, 0.05)
        .add(t / 10)
        .reshape([2, 2, 40])
    );

    if (t % 2 == 0) {
      interact.setTensor(tensor);
      interactHeatmap.setTensor(tensor);
      interactMultiplies.setTensor(tensor);
    }
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
