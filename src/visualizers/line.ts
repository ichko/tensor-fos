import { Tensor, Rank } from '@tensorflow/tfjs-core';
import { TensorVisualizer } from './tensor-visualizer';
import * as d3 from 'd3';
import * as fc from 'd3fc';
import * as fcs from '@d3fc/d3fc-series';

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
  private chart: any;
  yExtent: any;
  xExtent: any;
  selection!: d3.Selection<HTMLElement, unknown, null, undefined>;

  constructor(config: Config) {
    super(config);
    this.container = document.createElement('div');
  }

  protected build({ width = 400, height = 250 }: Config): void {
    this.xExtent = fc
      .extentLinear()
      .accessors([(_d: number, i: number) => i])
      .pad([0, 0]);

    const gridlines = fc.annotationSvgGridline().yTicks(5).xTicks(0);

    this.yExtent = fc
      .extentLinear()
      .accessors([(d: number) => d])
      .pad([0.5, 0.5]);

    const xScale = d3.scaleLinear();
    const yScale = d3.scaleLinear();

    const fillColor = fc.webglFillColor([0.6, 0.6, 0.6, 1]);

    const line = fcs
      .seriesWebglLine()
      .crossValue((_d: number, i: number) => i)
      .mainValue((d: number) => d);

    const multi = fc.seriesSvgMulti().series([gridlines]);

    this.chart = fc
      .chartCartesian(xScale, yScale)
      .yOrient('left')
      .svgPlotArea(multi)
      .webglPlotArea(line);

    this.selection = d3
      .select(this.container)
      .style('width', width + 'px')
      .style('height', height + 'px');
  }

  protected draw(tensor: Tensor<Rank>): void {
    const data = tensor.dataSync();

    this.chart.yDomain(this.yExtent(data)).xDomain(this.xExtent(data));
    this.selection.datum(data).call(this.chart);
  }

  public get domElement(): HTMLElement {
    return this.container;
  }
}
