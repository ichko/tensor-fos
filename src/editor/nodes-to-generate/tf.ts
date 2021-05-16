import { layers } from '@tensorflow/tfjs';

export type { ActivationIdentifier } from '@tensorflow/tfjs-layers/dist/keras_format/activation_config';
export type { DenseLayerArgs } from '@tensorflow/tfjs-layers/dist/layers/core';

export const dense = layers.dense;
