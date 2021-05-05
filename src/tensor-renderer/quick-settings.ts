import { Tensor, Rank } from '@tensorflow/tfjs-core';
import QuickSettings, { AnyModel, QuickSettingsPanel } from 'quicksettings';
import { BaseRenderer } from './base-renderer';

interface Props<P> {
  title: string;
  pos: { x: number; y: number };
  renderer: BaseRenderer<P>;
}

export class QuickSettingsRenderer<P> extends BaseRenderer<Props<P>> {
  private element!: HTMLElement;
  private settings!: QuickSettingsPanel<AnyModel, string>;

  constructor(props: Props<P>) {
    super(props);
    this.build(props);
  }

  get domElement() {
    return this.element;
  }

  protected async build(config: Props<P>) {
    const parent = document.createElement('div');

    this.settings = QuickSettings.create(
      this.config.pos.x,
      this.config.pos.y,
      this.config.title,
      parent
    );
    this.element = parent.firstChild! as HTMLElement;

    const anySettings = this.settings as any;
    anySettings._panel.style.width = 'auto';
    this.settings.addElement('', this.config.renderer.domElement);
  }

  protected async draw(tensor: Tensor<Rank>, config: Props<P>) {
    this.config.renderer.setTensor(tensor);
  }
}
