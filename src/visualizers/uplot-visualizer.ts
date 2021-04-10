import { Tensor, Rank } from '@tensorflow/tfjs-core';
import { TensorVisualizer } from './tensor-visualizer';

import uPlot from 'uplot';

interface Config {}

export class UPlotVisualizer extends TensorVisualizer<Config> {
  constructor(config: Config = {}) {
    super(config);

    require('uplot/dist/uPlot.min.css'); // Inject CSS

    let data = [
      [1546300800, 1546387200], // x-values (timestamps)
      [35, 80], // y-values (series 1)
      [90, 90], // y-values (series 2)
    ];

    let opts = {
      title: 'My Chart',
      id: 'chart1',
      class: 'my-chart',
      width: 800,
      height: 250,
      series: [
        {},
        {
          // initial toggled state (optional)
          show: true,

          spanGaps: false,

          // in-legend display
          label: 'RAM',
          value: (self: any, rawValue: any) => '$' + rawValue.toFixed(2),

          // series style
          stroke: 'red',
          width: 1,
          fill: 'rgba(255, 0, 0, 0.3)',
          dash: [10, 5],
        },
      ],
    };

    let uplot = new uPlot(opts, data as any, document.body);
  }
  protected build(config: Config): void {
    throw new Error('Method not implemented.');
  }
  protected draw(tensor: Tensor<Rank>, config: Config): void {
    throw new Error('Method not implemented.');
  }
  public get domElement(): HTMLElement {
    throw new Error('Method not implemented.');
  }
}
