import * as d3 from 'd3';
import * as tf from '@tensorflow/tfjs';
import { getCmap } from './cmap';

const cmap = getCmap('viridis');

export function visualize(
  tensor: tf.Tensor,
) {
  const [min, max] = [tensor.min(), tensor.max()]
  const dist = max.sub(min);
  const normalData = tensor.sub(min).div(dist).dataSync();

  const shape = tensor.shape;
  const [height, width] =
    shape.slice(shape.length - 2, shape.length)

  const pixelSize = 3;
  const padding = 0;
  const outerPadding = 0;

  const canvasWidth  = 2 * outerPadding
    + pixelSize * width
    + padding * (width - 1);
  const canvasHeight  = 2 * outerPadding 
    + pixelSize * height
    + padding * (height - 1);

  const canvas = d3.select('body')
    .append('canvas')
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)
    .style('border', '2px solid black');

  const context = canvas.node()?.getContext('2d')!;

  var scaleW = d3.scaleLinear()
    .range([0, width - 1])
    .domain([0, width - 1]);

  var scaleH = d3.scaleLinear()
    .range([0, height - 1])
    .domain([0, height - 1]);

  normalData.forEach((d: number, i: number) => {
    const x = outerPadding + scaleW(i % width) *
      (pixelSize + padding);
    const y = outerPadding + scaleH(Math.floor(i / width)) *
      (pixelSize + padding);

    context.beginPath();
    context.rect(x, y, pixelSize, pixelSize);
    context.fillStyle = cmap(d);
    context.fill();
    context.closePath();
  });
}
