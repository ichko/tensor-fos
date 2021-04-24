import * as tf from '@tensorflow/tfjs';
import { SymbolicTensor } from '@tensorflow/tfjs';
import mnist from 'mnist';

export function loadMnist() {
  const set = mnist.set(60000, 10000);

  const trainingSet = set.training;
  const testSet = set.test;
  const example = trainingSet[0].input;
  const tensor = tf.tensor(example).reshape([28, 28]);

  tensor.print();
  console.log({ tensor });
}

export function exampleVAE() {
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
  const data = loadMnist();
}
