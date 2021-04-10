import { Tensor } from '@tensorflow/tfjs-core';
import { range } from 'src/utils';
import { TensorVisualizer } from './tensor-visualizer';

export const defaultDimDirection = (dimDirections: Direction[], ndim: number) =>
  dimDirections.length > 0
    ? dimDirections
    : range(ndim)
        .map(i => (i % 2 == 0 ? 'horizontal' : 'vertical'))
        .reverse();

export const defaultDimGaps = (dimGaps: number[], ndim: number) =>
  dimGaps.length > 0
    ? dimGaps
    : range(ndim)
        .map(i => Math.floor(4 ** Math.floor(i / 2) / 2))
        .reverse();

export type Direction = 'horizontal' | 'vertical';

interface Config {
  nDimsEntity: number;
  padding?: number;
  dimGaps?: number[];
  dimDirections?: Direction[];
}

export class SmallMultiplesVisualizer<T> extends TensorVisualizer<Config> {
  private container: HTMLDivElement;
  private entityVisCtor: () => TensorVisualizer<T>;
  private visInstances: TensorVisualizer<T>[] = [];

  constructor(config: Config, entityVisCtor: () => TensorVisualizer<T>) {
    super(config);
    this.container = document.createElement('div');
    this.entityVisCtor = entityVisCtor;
  }

  protected build({
    padding,
    dimDirections = [],
    dimGaps = [],
    nDimsEntity,
  }: Config) {
    if (nDimsEntity > this.ndim - 1) {
      throw new Error(
        'ndim of tensor too small to show meaningful dims of visualization'
      );
    }

    this.container.style.padding = `${padding}px`;
    dimDirections = defaultDimDirection(dimDirections, this.ndim);
    dimGaps = defaultDimGaps(dimGaps, this.ndim);
    this.container.innerHTML = '';
    this.visInstances = [];

    let front: HTMLElement[] = [this.container];
    const lastDimId = this.ndim - nDimsEntity - 1;

    range(lastDimId + 1).map(i => {
      const dim = this.shape[i];
      const lastDim = i == lastDimId;
      const newFront: HTMLElement[] = [];

      front.forEach(node => {
        node.style.display = 'grid';
        node.style.gridGap = `${dimGaps[i]}px`;
        if (dimDirections[i] == 'horizontal') {
          node.style.gridTemplateColumns = `repeat(${dim}, auto)`;
        } else {
          node.style.gridTemplateRows = `repeat(${dim}, auto)`;
        }

        range(dim).forEach(_ => {
          const nested = document.createElement('div');
          node.appendChild(nested);
          newFront.push(nested);

          if (lastDim) {
            const vis = this.entityVisCtor();
            this.visInstances.push(vis);
            nested.appendChild(vis.domElement);
          }
        });
      });

      front = newFront;
    });
  }

  protected draw(tensor: Tensor): void {
    const entityShape = tensor.shape.slice(
      tensor.shape.length - this.config.nDimsEntity,
      tensor.shape.length
    );
    tensor = tensor.reshape([-1, ...entityShape]);
    const itSize = tensor.shape[0];
    tensor.split(itSize, 0).forEach((t: Tensor, i: number) => {
      const visTensor = t.squeeze([0]);
      this.visInstances[i].setTensor(visTensor);
    });
  }

  public setInternal(config: Partial<T>) {
    this.visInstances.forEach(vi => {
      vi.set(config);
    });
  }

  public get domElement(): HTMLElement {
    return this.container;
  }
}
