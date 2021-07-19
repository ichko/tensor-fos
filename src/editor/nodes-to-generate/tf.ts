export { layers as tfLayers } from '@tensorflow/tfjs';

export type { ActivationIdentifier } from '@tensorflow/tfjs-layers/dist/keras_format/activation_config';
export type { DenseLayerArgs } from '@tensorflow/tfjs-layers/dist/layers/core';

import { reshape } from '@tensorflow/tfjs';

export const tfCommon = {
  reshape,
};

export function add({ a, b }: { a: number; b: number }) {
  return { c: a + b };
}
