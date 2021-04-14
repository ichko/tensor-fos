import { Tensor, Rank } from '@tensorflow/tfjs-core';
import { BaseRenderer } from './base-renderer';
import { range } from 'src/utils';

import uPlot from 'uplot';

interface Config {}

export class UPlotRenderer extends BaseRenderer<Config> {
  private uplot!: uPlot;
  private container: HTMLDivElement;

  constructor(config: Config = {}) {
    super(config);

    require('uplot/dist/uPlot.min.css'); // Inject CSS
    this.container = document.createElement('div');
  }

  protected build(config: Config): void {
    const data = [[], []];

    const opts = {
      width: 200,
      height: 100,
      pxAlign: false,
      show: true,
      cursor: {
        show: false,
      },
      select: {
        show: false,
      },
      legend: {
        show: false,
      },
      scales: {
        x: {
          time: false,
        },
      },
      axes: [
        {
          show: false,
        },
        {
          show: true,
        },
      ],
      series: [
        {},
        {
          stroke: '#03a9f4',
          fill: '#b3e5fc',
        },
      ],
    };

    this.uplot = new uPlot(opts as any, data as any, this.container);
  }

  protected draw(tensor: Tensor<Rank>, config: Config): void {
    const yData = tensor.dataSync();
    const data = [range(yData.length), yData];
    this.uplot.setData(data as any);
  }

  public get domElement(): HTMLElement {
    return this.container;
  }
}
