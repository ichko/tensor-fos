import { TfJsVisRenderer } from './../tensor-renderer/tfjs-vis';
import { SmallMultiplesRenderer } from './../tensor-renderer/small-multiples';
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

export class MnistClassifier {
  model: ml.MnistClassifier.Model;
  color = colors.model;

  constructor() {
    this.model = new ml.MnistClassifier.Model();
    this.model.net.summary();
  }

  async call({
    forwardBatch,
    optimBatch,
  }: {
    forwardBatch: ml.MnistClassifier.Batch;
    optimBatch: ml.MnistClassifier.Batch;
  }) {
    return {
      preds: this.model.forward(forwardBatch.x),
      optimStep: this.model.optimStep(optimBatch),
    };
  }
}

export function selectBatchX({ batch }: { batch: any }) {
  return { x: batch.x };
}

export class Heatmap {
  renderer: SmallMultiplesRenderer<any>;
  color = colors.visual;

  get domElement() {
    return this.renderer.domElement;
  }

  constructor() {
    this.renderer = new SmallMultiplesRenderer(
      {
        nDimsEntity: 2,
        dimDirections: ['horizontal', 'vertical', 'horizontal', 'vertical'],
      },
      () => new TfJsVisRenderer({ type: 'heatmap' })
    );
  }

  async call({ tensor }: { tensor: Tensor }) {
    this.renderer.setTensor(tensor);
  }
}

export class BarChart {
  renderer: SmallMultiplesRenderer<any>;
  color = colors.visual;

  get domElement() {
    return this.renderer.domElement;
  }

  constructor() {
    this.renderer = new SmallMultiplesRenderer(
      {
        nDimsEntity: 1,
        dimDirections: ['horizontal', 'vertical', 'horizontal'],
      },
      () => new TfJsVisRenderer({ type: 'barchart' })
    );
  }

  async call({ tensor }: { tensor: Tensor }) {
    this.renderer.setTensor(tensor);
  }
}
