import { Tensor } from '@tensorflow/tfjs-core';

export abstract class TensorVisualizer<Config> {
  private lastTensor?: Tensor;
  private get shape(): number[] | undefined {
    return this.lastTensor?.shape;
  }

  protected abstract build(tensorShape: number[], config: Config): void;
  protected abstract draw(tensor: Tensor): void;

  public constructor(private config: Config) {}
  public abstract get domElement(): HTMLElement;

  public setTensor(tensor: Tensor) {
    const shouldRebuild = this.shape !== tensor.shape;
    this.lastTensor = tensor;

    if (shouldRebuild) {
      this.build(tensor.shape, this.config);
    }

    this.draw(tensor);
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
      this.build(this.shape, this.config);
      this.draw(this.lastTensor);
    }
  }
}
