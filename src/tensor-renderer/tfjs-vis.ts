import { Tensor, Rank } from '@tensorflow/tfjs-core';
import { BaseRenderer } from './base-renderer';

import * as tfvis from '@tensorflow/tfjs-vis';

interface Props {
  type: 'barchart' | 'heatmap';
}

export class TfJsVisRenderer extends BaseRenderer<Props> {
  private container: HTMLElement;

  constructor(props: Props | undefined = { type: 'heatmap' }) {
    super(props);

    this.container = document.createElement('div');
    // this.container.style.width = '100px';
    // this.container.style.height = '100px';
  }

  protected async build(config: Props) {
    // nothing to do here
  }

  protected async draw(tensor: Tensor<Rank>, config: Props) {
    // TODO: This might be too slow for realtime!!! >:(
    if (this.config.type === 'heatmap') {
      const tensorData = await tensor.data();
      const cols = tensor.shape[0];
      const rows = tensor.shape[1]!;

      const values = [];
      for (let j = 0; j < rows; j++) {
        const col = [];
        for (let i = 0; i < cols; i++) {
          const val = tensorData[i + j * rows];
          col.push(val);
        }
        values.push(col);
      }
      const data = { values };

      tfvis.render.confusionMatrix(this.container, data, {
        width: 150,
        height: 120,
        showTextOverlay: false,
        shadeDiagonal: true,
        colorMap: 'viridis',
        fontSize: 0,
      });
    } else if (this.config.type === 'barchart') {
      const tensorData = await tensor.data();
      const data = Array.from(tensorData).map((v: number, i: number) => ({
        index: i,
        value: v,
      }));

      tfvis.render.barchart(this.container, data, {
        width: 150,
        height: 120,
      });
    }
  }

  public get domElement(): HTMLElement {
    return this.container;
  }
}
