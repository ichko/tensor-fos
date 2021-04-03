import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { minMaxNormalize, range, viridis } from 'src/utils';
import { TensorVisualizer } from './tensor-visualizer';

export type Direction = 'horizontal' | 'vertical';

interface Config {
  outerPadding?: number;
  dimPaddings?: number[];
  dimDirections?: Direction[];
  tensorShape: number[];
  pixelSize: number;
}

export class NDTensorHeatmapVisualizer extends TensorVisualizer<Config> {
  private canvas: HTMLCanvasElement;

  private context!: CanvasRenderingContext2D;
  private tensorShape!: number[];
  private dimDisplacementW!: number[];
  private dimDisplacementH!: number[];
  private pixelSize!: number;
  private ndim!: number;
  private outerPadding!: number;
  private dimPaddings!: number[];

  constructor(config: Config) {
    super(config);
    this.canvas = document.createElement('canvas');
    this.build(config);
  }

  build({
    pixelSize,
    tensorShape,
    outerPadding,
    dimDirections = [],
    dimPaddings = [],
  }: Config) {
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

  setTensor(tensor: tf.Tensor): void {
    super.setTensor(tensor);

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
      this.context.fillStyle = viridis(d);
      this.context.fill();
      this.context.closePath();

      index[index.length - 1] += 1;
    });
  }

  getHTMLElement(): HTMLElement {
    return this.canvas;
  }
}
