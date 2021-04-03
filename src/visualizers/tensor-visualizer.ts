import { Tensor } from '@tensorflow/tfjs-core';

export abstract class TensorVisualizer<Config> {
  private lastTensor?: Tensor;

  public constructor(private config: Config) {}

  public setTensor(tensor: Tensor) {
    this.lastTensor = tensor;
  }

  public abstract getHTMLElement(): HTMLElement;

  public abstract build(config: Config): void;

  public setProps(config: Partial<Config>) {
    let shouldRebuild = false;
    for (let name in config) {
      if (this.config[name] != config[name]) {
        shouldRebuild = true;
      }

      this.config[name] = config[name]!;
    }

    if (shouldRebuild) {
      this.build(this.config);

      if (this.lastTensor) {
        this.setTensor(this.lastTensor);
      }
    }
  }
}
