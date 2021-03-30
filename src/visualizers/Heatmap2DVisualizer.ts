import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { minMaxNormalize, viridis } from 'src/utils';
import { TensorVisualizer } from './NDTensorHeatmapVisualizer';

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
          this.context.fillStyle = viridis(d);
          this.context.fill();
          this.context.closePath();
        });
      });
  }

  getHTMLElement(): HTMLElement {
    return this.canvas;
  }
}