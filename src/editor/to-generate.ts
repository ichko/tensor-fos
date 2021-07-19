import { Tensor } from '@tensorflow/tfjs-core';
export { layers as tfLayers } from '@tensorflow/tfjs';
import * as tf from '@tensorflow/tfjs';

export type { ActivationIdentifier } from '@tensorflow/tfjs-layers/dist/keras_format/activation_config';
export type { DenseLayerArgs } from '@tensorflow/tfjs-layers/dist/layers/core';

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
  return { out: tf.reshape(tensor, shape) };
}
