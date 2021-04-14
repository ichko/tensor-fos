import { Tensor } from '@tensorflow/tfjs-core';
import { BaseRenderer } from './base-renderer';
import * as d3 from 'd3';
import * as fc from 'd3fc';
import * as fcs from '@d3fc/d3fc-series';
import { capitalize } from 'src/utils';

export type D3fcSeriesType = 'line' | 'point' | 'area' | 'bar' | 'heatmap';

export type D3fcRenderType = 'webgl' | 'canvas' | 'svg';

type CrossIndex = 'infer' | 'consecutive' | 'from-tensor';
interface Style {
  size?: number;
  color?: string;
  orient?: 'horizontal' | 'vertical';
}

interface Config {
  type: D3fcSeriesType;
  renderer: D3fcRenderType;
  style?: Style;
  width?: number;
  height?: number;
  crossIndex?: CrossIndex;
  showAxis?: boolean;
}

const style = document.createElement('style');
style.innerHTML = `
  d3fc-group.cartesian-chart {
    grid-template-columns: 0 auto 1fr auto minmax(1em,max-content);
    grid-template-rows: minmax(1em,max-content) auto 1fr auto 0;
  }
`;

document.body.appendChild(style);

function getSeriesInstance(type: D3fcSeriesType, renderer: D3fcRenderType) {
  // TODO: This is just a hack. Remove after d3fc provide types.
  interface Indexable {
    [name: string]: any;
  }

  const typeCapital = capitalize(type);
  const rendererCapital = capitalize(renderer);

  const d3fcAccessor = `series${rendererCapital}${typeCapital}`;
  const d3fcSeriesObj = fcs as Indexable;

  if (d3fcSeriesObj.hasOwnProperty(d3fcAccessor)) {
    const instance = d3fcSeriesObj[d3fcAccessor]();

    if (type === 'heatmap') {
      return fc.autoBandwidth(instance).widthFraction(1.1);
    }

    return instance;
  } else {
    throw new Error(
      `Error: ${renderer} renderer and ${type} series do not exist as "${d3fcAccessor}" property on d3fc-series`
    );
  }
}

function styleSeries(
  type: D3fcSeriesType,
  series: any,
  { color = 'black', orient = 'vertical', size = 1 }: Style
): any {
  try {
    switch (type) {
      case 'line':
        return series.orient(orient).lineWidth(size);
      case 'point':
        return series.orient(orient).size(size);
      case 'area':
        return series.orient(orient);
      case 'bar':
        return series.orient(orient).bandwidth(size);
      case 'heatmap':
        return series;
    }
  } catch (e) {
    if (e instanceof TypeError) {
      console.warn(`Could not style series of type ${type} (${e.message})`);
      return series;
    }

    throw e;
  }

  // throw new Error(`Missing type styling code for type ${type}`);
}

function buildChart(
  xScale: d3.ScaleLinear<number, number, never>,
  yScale: d3.ScaleLinear<number, number, never>,
  renderer: D3fcRenderType,
  series: any,
  showAxis: boolean
) {
  const gridlines = fc.annotationSvgGridline().yTicks(5).xTicks(0);
  const svgMultiArr = [];
  let multi: any = undefined;

  switch (renderer) {
    case 'svg':
      svgMultiArr.push(series);
      break;
    case 'canvas':
      multi = fc.seriesCanvasMulti().series([series]);
      break;
    case 'webgl':
      multi = fc.seriesWebglMulti().series([series]);
  }
  const svgMulti = fc.seriesSvgMulti().series(svgMultiArr);

  const chart = fc
    .chartCartesian(xScale, yScale)
    .yOrient('left')
    .svgPlotArea(svgMulti);

  switch (renderer) {
    case 'svg':
      break;
    case 'canvas':
      chart.canvasPlotArea(multi);
      break;
    case 'webgl':
      chart.webglPlotArea(multi);
      break;
  }

  return chart;
}

export class D3fcSeriesRenderer extends BaseRenderer<Config> {
  private container: HTMLElement;
  private chart: any;
  private selection!: d3.Selection<HTMLElement, unknown, null, undefined>;
  private series: any;
  private crossIndex!: CrossIndex;
  private xScale!: d3.ScaleLinear<number, number, never>;
  private yScale!: d3.ScaleLinear<number, number, never>;

  constructor(config: Config) {
    super(config);
    this.container = document.createElement('div');
  }

  protected build({
    renderer,
    style = {},
    width = 400,
    height = 250,
    type = 'line',
    crossIndex = 'infer',
    showAxis = true,
  }: Config): void {
    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();

    this.config.renderer = renderer;
    this.crossIndex = crossIndex;
    this.series = getSeriesInstance(type, renderer);
    this.series = styleSeries(type, this.series, style);

    this.chart = buildChart(
      this.xScale,
      this.yScale,
      renderer,
      this.series,
      showAxis
    );

    this.selection = d3
      .select(this.container)
      .style('width', width + 'px')
      .style('height', height + 'px');
  }

  protected draw(tensor: Tensor): void {
    const shape = tensor.shape;
    const data = tensor.dataSync();

    if (this.config.type === 'heatmap') {
      const [height, width] = tensor.shape.slice(
        tensor.shape.length - 2,
        tensor.shape.length
      );

      const crossIndex = (_d: number, i: number) => i % width;
      const mainIndex = (_d: number, i: number) => Math.floor(i / width);

      const xExtent = fc
        .extentLinear()
        .accessors([crossIndex])
        .pad([0, 0])
        .include([-0.5, width - 0.5]);
      const yExtent = fc
        .extentLinear()
        .accessors([mainIndex])
        .pad([0, 0])
        .include([-0.5, height - 0.5]);

      this.xScale.range([0, width]);
      this.yScale.range([height, 0]);

      this.series
        .xValue(crossIndex)
        .yValue(mainIndex)
        .colorValue((d: number, _i: number) => d)
        .colorInterpolate(d3.interpolateViridis);

      this.chart.yDomain(yExtent(data)).xDomain(xExtent(data));
      this.selection.datum(data).call(this.chart);
    } else {
      const lastDimSize = shape[shape.length - 1];
      const inferredIndexType: CrossIndex =
        this.crossIndex === 'infer' && shape.length > 1
          ? 'from-tensor'
          : 'consecutive';

      let crossIndex = (_d: number, i: number) => i;
      let mainIndex = (_d: number, i: number) => data[i];

      if (inferredIndexType == 'from-tensor') {
        crossIndex = (_d: number, i: number) => data[i];
        mainIndex = (_d: number, i: number) => data[i + lastDimSize];
      }

      const xExtent = fc.extentLinear().accessors([crossIndex]).pad([0, 0]);
      const yExtent = fc.extentLinear().accessors([mainIndex]).pad([0.3, 0.3]);

      this.series.crossValue(crossIndex).mainValue(mainIndex);

      this.chart.yDomain(yExtent(data)).xDomain(xExtent(data));
      this.selection.datum(data).call(this.chart);
    }
  }

  public get domElement(): HTMLElement {
    return this.container;
  }
}
