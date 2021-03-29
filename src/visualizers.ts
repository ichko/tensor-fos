import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { getCmap } from './cmap';

const cmap = getCmap('viridis');

const minMaxNormalize = (tensor: tf.Tensor): tf.Tensor => {
  const [min, max] = [tensor.min(), tensor.max()];
  const dist = max.sub(min);

  return tensor.sub(min).div(dist);
};

export interface TensorVisualizer {
  setTensor(tensor: tf.Tensor): void;
  getHTMLElement(): HTMLElement;
}

export class Heatmap2DVisualizer implements TensorVisualizer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private width: number;
  private height: number;
  private pixelSize: number;
  private padding: number;
  private outerPadding: number;

  private scaleW: d3.ScaleLinear<number, number, never>;
  private scaleH: d3.ScaleLinear<number, number, never>;

  constructor(tensor: tf.Tensor) {
    this.canvas = document.createElement('canvas');

    const shape = tensor.shape;
    const [height, width] = shape.slice(shape.length - 2, shape.length);
    this.width = width;
    this.height = height;

    this.pixelSize = 4;
    this.padding = 0;
    this.outerPadding = 0;

    const canvasWidth =
      2 * this.outerPadding +
      this.pixelSize * this.width +
      this.padding * (width - 1);
    const canvasHeight =
      2 * this.outerPadding +
      this.pixelSize * this.height +
      this.padding * (height - 1);

    d3.select(this.canvas)
      .attr('width', canvasWidth)
      .attr('height', canvasHeight)
      .style('border', '1px solid black')
      .style('background', '#000');

    this.context = this.canvas.getContext('2d')!;

    this.scaleW = d3
      .scaleLinear()
      .range([0, width - 1])
      .domain([0, width - 1]);

    this.scaleH = d3
      .scaleLinear()
      .range([0, height - 1])
      .domain([0, height - 1]);

    this.setTensor(tensor);
  }

  setTensor(tensor: tf.Tensor): void {
    minMaxNormalize(tensor)
      .data()
      .then(normalData => {
        normalData.forEach((d: number, i: number) => {
          const x =
            this.outerPadding +
            this.scaleW(i % this.width) * (this.pixelSize + this.padding);
          const y =
            this.outerPadding +
            this.scaleH(Math.floor(i / this.width)) *
              (this.pixelSize + this.padding);

          this.context.beginPath();
          this.context.rect(x, y, this.pixelSize, this.pixelSize);
          this.context.fillStyle = cmap(d);
          this.context.fill();
          this.context.closePath();
        });
      });
  }

  getHTMLElement(): HTMLElement {
    return this.canvas;
  }
}

export type Direction = 'horizontal' | 'vertical';

export interface NDHeatmapVisualizerConfig {
  outerPadding?: number;
  dimPaddings?: number[];
  dimDirections?: Direction[];
  tensorShape: number[];
  pixelSize: number;
}

const zip = <A, B>(a: A[], b: B[]): [A, B][] => a.map((a, i) => [a, b[i]]);
const range = (n: number) => Array.from(Array(n).keys());

export class NDTensorHeatmapVisualizer implements TensorVisualizer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  private tensorShape: number[];

  private dimDisplacementW: number[];
  private dimDisplacementH: number[];
  private pixelSize: number;
  private ndim: number;
  private outerPadding: number;
  private dimPaddings: number[];

  constructor({
    pixelSize,
    tensorShape,
    outerPadding,
    dimDirections = [],
    dimPaddings = [],
  }: NDHeatmapVisualizerConfig) {
    this.canvas = document.createElement('canvas');

    this.tensorShape = tensorShape;
    this.pixelSize = pixelSize;
    this.ndim = tensorShape.length;

    let lastDimSizeW = pixelSize;
    let lastDimSizeH = pixelSize;
    let defaultOuterPadding = 0;

    this.dimDisplacementW = range(this.tensorShape.length).fill(0);
    this.dimDisplacementH = range(this.tensorShape.length).fill(0);

    dimDirections =
      dimDirections.length > 0
        ? dimDirections
        : range(this.ndim)
            .map(i => (i % 2 == 0 ? 'horizontal' : 'vertical'))
            .reverse();

    dimPaddings =
      dimPaddings.length > 0
        ? dimPaddings
        : range(this.ndim)
            .map(i => Math.floor(4 ** Math.floor(i / 2) / 2))
            .reverse();

    this.dimPaddings = dimPaddings;

    range(tensorShape.length)
      .reverse()
      .forEach(i => {
        defaultOuterPadding = dimPaddings[i];

        if (dimDirections[i] == 'horizontal') {
          this.dimDisplacementW[i] = lastDimSizeW + dimPaddings[i];
          lastDimSizeW =
            tensorShape[i] * lastDimSizeW +
            (tensorShape[i] - 1) * dimPaddings[i];
        } else {
          this.dimDisplacementH[i] = lastDimSizeH + dimPaddings[i];
          lastDimSizeH =
            tensorShape[i] * lastDimSizeH +
            (tensorShape[i] - 1) * dimPaddings[i];
        }
      });

    this.outerPadding = outerPadding || defaultOuterPadding;

    const canvasWidth = 2 * this.outerPadding + lastDimSizeW;
    const canvasHeight = 2 * this.outerPadding + lastDimSizeH;

    d3.select(this.canvas)
      .attr('width', canvasWidth)
      .attr('height', canvasHeight)
      .style('border', '3px solid black')
      .style('background', '#fff');

    this.context = this.canvas.getContext('2d')!;
  }

  setTensor(tensor: tf.Tensor<tf.Rank>): void {
    const data = minMaxNormalize(tensor).dataSync();
    const index = range(this.tensorShape.length).fill(0);

    data.forEach((d: number) => {
      for (let i = index.length - 1; i >= 0; i--) {
        if (index[i] == this.tensorShape[i]) {
          index[i] = 0;
          index[i - 1] += 1;
        } else {
          break;
        }
      }

      let x = this.outerPadding;
      let y = this.outerPadding;
      for (let i = 0; i < this.tensorShape.length; i++) {
        x += index[i] * this.dimDisplacementW[i];
        y += index[i] * this.dimDisplacementH[i];
      }

      this.context.beginPath();
      this.context.rect(x, y, this.pixelSize, this.pixelSize);
      this.context.fillStyle = cmap(d);
      this.context.fill();
      this.context.closePath();

      index[index.length - 1] += 1;
    });
  }

  getHTMLElement(): HTMLElement {
    return this.canvas;
  }
}
