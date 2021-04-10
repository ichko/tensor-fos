import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { MNISTDataset } from 'tfjs-data-mnist';

import { Tensor } from '@tensorflow/tfjs';
import { D3fcSeriesVisualizer } from './visualizers/d3fc-series';
import { HeatmapVisualizer } from './visualizers/heatmap';
import { SmallMultiplesVisualizer } from './visualizers/small-multiples';
import { UPlotVisualizer } from './visualizers/uplot-visualizer';
import { makeMenu, makeStats } from './ui';

window.onload = async () => {
  makeMenu();
  tf.backend();

  const stats = makeStats();

  const uplotVis = new UPlotVisualizer();

  d3.select('body')
    .append('button')
    .text('Reload')
    .on('click', () => main());

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
