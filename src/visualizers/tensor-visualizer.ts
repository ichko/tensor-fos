import { Tensor } from '@tensorflow/tfjs-core';
import { arraysEqual } from 'src/utils';

export abstract class TensorVisualizer<Config> {
  private lastTensor?: Tensor;

  public get tensor(): Tensor | undefined {
    return this.lastTensor;
  }

  public get shape(): number[] {
    return this.lastTensor?.shape || [];
  }

  public get ndim(): number {
    return this.lastTensor?.shape.length || -1;
  }

  protected abstract build(config: Config): void;
  protected abstract draw(tensor: Tensor, config: Config): void;

  public constructor(protected config: Config) {}
  public abstract get domElement(): HTMLElement;

  public setTensor(tensor: Tensor) {
    const shouldRebuild = !arraysEqual(this.shape, tensor.shape);
    this.lastTensor = tensor;

    if (shouldRebuild) {
      this.build(this.config);
    }

    this.draw(tensor, this.config);
  }

  public set(config: Partial<Config>) {
    let shouldRebuild = false;

    for (let name in config) {
      if (this.config[name] != config[name]) {
        shouldRebuild = true;
      }

      this.config[name] = config[name]!;
    }

    if (shouldRebuild && this.shape && this.lastTensor) {
      this.build(this.config);
      this.draw(this.lastTensor, this.config);
    }
  }
}
