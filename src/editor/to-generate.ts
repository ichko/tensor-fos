import { Tensor } from '@tensorflow/tfjs-core';
export { layers as tfLayers } from '@tensorflow/tfjs';
import * as tf from '@tensorflow/tfjs';
import * as ml from 'src//ml';

export const colors = {
  model: '#fb3079',
  visual: 'white',
  dataSrc: '#16ff85',
  util: '#ffb316',
};

export function add({ a, b }: { a: number; b: number }) {
  return { c: a + b };
}

export function reshape({
  tensor,
  shape,
}: {
  tensor: Tensor;
  shape: number[];
}) {
  return { out: tensor.reshape(shape) };
}

export class Mnist {
  trainDataset: any;
  exampleBatch: any;
  color = colors.dataSrc;

  async init() {
    const mnist = ml.data.loadMnist();
    this.trainDataset = await mnist({ bs: 16 }).iterator();
    this.exampleBatch = (await this.trainDataset.next()).value;
  }

  async call() {
    return {
      nextBatch: (await this.trainDataset.next()).value,
      exampleBatch: this.exampleBatch,
    };
  }
}
