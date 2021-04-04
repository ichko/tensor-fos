import { Tensor, Rank } from '@tensorflow/tfjs-core';
import { TensorVisualizer } from './tensor-visualizer';
import * as d3 from 'd3';
import * as fc from 'd3fc';
import * as fcs from '@d3fc/d3fc-series';
import * as fca from '@d3fc/d3fc-axis';
import * as fcc from '@d3fc/d3fc-chart';

interface Config {
  lineWidth?: number;
  width?: number;
  height?: number;
}

const style = document.createElement('style');
style.innerHTML = `
  d3fc-group.cartesian-chart {
    grid-template-columns: 0 auto 1fr auto minmax(1em,max-content);
    grid-template-rows: minmax(1em,max-content) auto 1fr auto 0;
  }
`;

document.body.appendChild(style);

export class LineVisualizer extends TensorVisualizer<Config> {
  private container: HTMLElement;

  constructor(config: Config) {
    super(config);
    this.container = document.createElement('div');
  }

  protected build(tensorShape: number[], config: Config): void {}

  protected draw(
    tensor: Tensor<Rank>,
    { width = 400, height = 250 }: Config
  ): void {
    const [min, max] = [tensor.min().dataSync()[0], tensor.max().dataSync()[0]];
    const data = tensor.dataSync();

    const xExtent = fc
      .extentLinear()
      .accessors([(_d: number, i: number) => i])
      .pad([0, 0]);

    const gridlines = fc.annotationSvgGridline().yTicks(5).xTicks(0);

    const yExtent = fc
      .extentLinear()
      .accessors([(d: number) => d])
      .pad([0.5, 0.5]);

    const xScale = d3.scaleLinear().domain(xExtent(data));
    const yScale = d3.scaleLinear().domain(yExtent(data));

    const fillColor = fc.webglFillColor([0.6, 0.6, 0.6, 1]);

    const line = fcs
      .seriesWebglLine()
      .crossValue((_d: number, i: number) => i)
      .mainValue((d: number) => d)
      .decorate((program: any) => {
        fillColor(program);
      });

    const multi = fc.seriesSvgMulti().series([gridlines]);

    const chart = fc
      .chartCartesian(xScale, yScale)
      .yOrient('left')
      .svgPlotArea(multi)
      .webglPlotArea(line);
    // .xLabel('Mass (carats)')
    // .yLabel('Price (US$)')
    // .chartLabel('Test');

    d3.select(this.container)
      .style('width', width + 'px')
      .style('height', height + 'px')
      .datum(data)
      .call(chart);
  }

  public get domElement(): HTMLElement {
    return this.container;
  }
}
