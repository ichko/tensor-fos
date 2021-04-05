import { Tensor } from '@tensorflow/tfjs-core';
import { TensorVisualizer } from './tensor-visualizer';
import * as d3 from 'd3';
import * as fc from 'd3fc';
import * as fcs from '@d3fc/d3fc-series';
import { capitalize } from 'src/utils';

type SeriesType = 'line' | 'point' | 'area' | 'bar' | 'heatmap';

type RenderType = 'webgl' | 'canvas' | 'svg';

interface Style {
  size?: number;
  color?: string;
  orient?: 'horizontal' | 'vertical';
}

interface Config {
  type: SeriesType;
  renderer: RenderType;
  style?: Style;
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

function getSeriesConstructor(type: SeriesType, renderer: RenderType) {
  // TODO: This is just a hack. Remove after d3fc provide types.
  interface Indexable {
    [name: string]: any;
  }

  const typeCapital = capitalize(type);
  const rendererCapital = capitalize(renderer);

  const d3fcAccessor = `series${rendererCapital}${typeCapital}`;
  const d3fcSeriesObj = fcs as Indexable;

  if (d3fcSeriesObj.hasOwnProperty(d3fcAccessor)) {
    return d3fcSeriesObj[d3fcAccessor]();
  } else {
    throw new Error(
      `Error: ${renderer} renderer and ${type} series do not exist as "${d3fcAccessor}" property on d3fc-series`
    );
  }
}

function styleSeries(
  type: SeriesType,
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
  renderer: RenderType,
  series: any
) {
  const gridlines = fc.annotationSvgGridline().yTicks(5).xTicks(0);
  const svgMultiArr = [gridlines];
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

export class D3fcSeriesVisualizer extends TensorVisualizer<Config> {
  private container: HTMLElement;
  private chart: any;
  private yExtent: any;
  private xExtent: any;
  private selection!: d3.Selection<HTMLElement, unknown, null, undefined>;
  private series: any;

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
  }: Config): void {
    const xScale = d3.scaleLinear();
    const yScale = d3.scaleLinear();

    this.series = getSeriesConstructor(type, renderer);
    this.series = styleSeries(type, this.series, style);

    this.chart = buildChart(xScale, yScale, renderer, this.series);

    this.selection = d3
      .select(this.container)
      .style('width', width + 'px')
      .style('height', height + 'px');
  }

  protected draw(tensor: Tensor): void {
    const shape = tensor.shape;
    const data = tensor.dataSync();
    const lastDimSize = shape[shape.length - 1];

    this.xExtent = fc
      .extentLinear()
      .accessors([(d: number, i: number) => data[i]])
      .pad([0, 0]);

    this.yExtent = fc
      .extentLinear()
      .accessors([(d: number, i: number) => data[i + lastDimSize]])
      .pad([0.3, 0.3]);

    this.series
      .crossValue((d: number, i: number) => data[i])
      .mainValue((d: number, i: number) => data[i + lastDimSize]);

    this.chart.yDomain(this.yExtent(data)).xDomain(this.xExtent(data));
    this.selection.datum(data).call(this.chart);
  }

  public get domElement(): HTMLElement {
    return this.container;
  }
}
