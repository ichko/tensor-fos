import { TfJsVisRenderer } from './../tensor-renderer/tfjs-vis';
import { SmallMultiplesRenderer } from './../tensor-renderer/small-multiples';
import { Tensor } from '@tensorflow/tfjs-core';
export { layers as tfLayers } from '@tensorflow/tfjs';
import * as tf from '@tensorflow/tfjs';
import * as ml from 'src//ml';
import { NodeEditor } from '.';
import { colors } from './registry';
import { Element, html } from './element';

export function reshape({
  tensor,
  shape,
}: {
  tensor: Tensor;
  shape: number[];
}) {
  return { out: tensor.reshape(shape) };
}

export class Layer {
  container: Element;

  layersMap = {
    dense: tf.layers.dense,
    conv2d: tf.layers.conv2d,
    flatten: tf.layers.flatten,

    relu: tf.layers.reLU,
    sigmoid: tf.sigmoid,
    softmax: tf.softmax,
    tanh: tf.tanh,

    batchNorm: tf.layers.batchNormalization,
  };

  get domElement() {
    return this.container.raw;
  }

  constructor() {
    this.container = html(`
      <select>
      ${Object.keys(this.layersMap).map(
        name => `<option value="${name}">${name}</option>`
      )}
      </select>
      <div></div>
    `);

    this.container.select('select').on('change', e => {
      console.log(e);
    });

    this.setLayer('dense');
  }

  setLayer(key: string) {
    this.container.select('div').raw.innerHTML = ``;
  }

  call({ input }: { input: Tensor }) {
    return { out: input };
  }
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
  renderer!: SmallMultiplesRenderer<any>;
  color = colors.visual;

  get domElement() {
    return this.renderer.domElement;
  }

  init() {
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
  renderer!: SmallMultiplesRenderer<any>;
  color = colors.visual;

  get domElement() {
    return this.renderer.domElement;
  }

  init() {
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

export class Step {
  button: HTMLButtonElement;

  get domElement() {
    return this.button;
  }

  constructor(editor: NodeEditor) {
    this.button = document.createElement('button');
    this.button.innerText = 'Play';

    let play = false;
    this.button.onclick = () => {
      play = !play;
      this.button.innerText = play ? 'Pause' : 'Play';
    };

    setInterval(() => {
      if (play) {
        editor.resolve();
      }
    }, 100);
  }
}
