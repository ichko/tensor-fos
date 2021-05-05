import * as tf from '@tensorflow/tfjs';
import { Optimizer, Scalar, Tensor } from '@tensorflow/tfjs';
import { namespace } from 'd3-selection';
import * as mnist from 'mnist';

tf.backend(); // Register backend
// tf.enableDebugMode();

export abstract class BaseModel<Input, Output, Batch> {
  abstract forward(x: Input): Output;

  abstract loss(batch: Batch): Scalar;

  abstract optimStep(batch: Batch): Promise<number>;
}

const set = mnist.set(60000, 10000);

export const data = {
  loadMnist: (shuffleBuffer = 128) => {
    const trainDataset = tf.data.array(set.training);
    const testDataset = tf.data.array(set.test);

    return ({ bs, shuffle = false }: { bs: number; shuffle?: boolean }) => {
      let ds = trainDataset;
      ds = ds.repeat(-1);
      if (shuffle) {
        ds = ds.shuffle(shuffleBuffer, 'seed');
      }
      ds = ds.batch(bs);
      ds = ds.map((item: any) => {
        return {
          x: item.input.reshape([-1, 28, 28]) as Tensor,
          y: item.output.cast('int32') as Tensor,
        };
      });

      return ds as tf.data.Dataset<{ x: Tensor; y: Tensor }>;
    };
  },
};

export namespace MnistClassifier {
  export interface Batch {
    x: Tensor;
    y: Tensor;
  }
  export type Input = Tensor;
  export type Output = Tensor;

  const optimizer = tf.train.adam();

  export class Model extends BaseModel<Input, Output, Batch> {
    net: tf.LayersModel;

    constructor() {
      super();

      const input = tf.input({ shape: [28, 28] });
      let x: any = input;
      x = tf.layers.flatten().apply(x);
      x = tf.layers.dense({ units: 32, activation: 'relu' }).apply(x);
      x = tf.layers.dense({ units: 10, activation: 'softmax' }).apply(x);

      this.net = tf.model({ inputs: input, outputs: x });
    }

    loss({ x, y }: Batch): Scalar {
      const y_hat = this.forward(x);
      return tf.metrics.categoricalCrossentropy(y, y_hat).mean();
    }

    forward(x: Input): Output {
      return this.net.apply(x) as Output;
    }

    async optimStep(batch: Batch) {
      const returnCost = true;
      return optimizer
        .minimize(() => this.loss(batch), returnCost)
        ?.dataSync()[0] as number;
    }
  }
}
