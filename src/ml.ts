import * as tf from '@tensorflow/tfjs';
import { SymbolicTensor, Tensor } from '@tensorflow/tfjs';
import * as mnist from 'mnist';

const set = mnist.set(60000, 10000);

export const data = {
  loadMnist: () => {
    const trainDataset = tf.data.array(set.training);
    const testDataset = tf.data.array(set.test);

    return ({ bs, shuffle = false }: { bs: number; shuffle?: boolean }) => {
      let ds = trainDataset;
      if (shuffle) {
        ds = ds.shuffle(128, 'seed');
      }
      ds = ds.batch(bs);
      ds = ds.map((item: any) => {
        return {
          x: item.input.reshape([-1, 28, 28]) as Tensor,
          y: item.output as Tensor,
        };
      });

      return ds as tf.data.Dataset<{ x: Tensor; y: Tensor }>;
    };
  },
};

export async function exampleVAE() {
  function makeModel() {
    const input1 = tf.input({ shape: [10] });
    const input2 = tf.input({ shape: [20] });
    const dense1 = tf.layers.dense({ units: 4 }).apply(input1);
    const dense2 = tf.layers.dense({ units: 8 }).apply(input2);
    const concat = tf.layers
      .concatenate()
      .apply([dense1, dense2] as SymbolicTensor[]);

    const output = tf.layers
      .dense({ units: 3, activation: 'softmax' })
      .apply(concat);

    const model = tf.model({
      inputs: [input1, input2],
      outputs: [output] as SymbolicTensor[],
    });

    return model;
  }

  const model = makeModel();
  model.summary();

  const mnist = data.loadMnist();
  const trainDataset = await mnist({ bs: 8 }).iterator();
  const batch = await trainDataset.next();

  console.log({ batch });
}
