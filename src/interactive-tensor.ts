import { Tensor } from '@tensorflow/tfjs-core';
import QuickSettings from 'quicksettings';
import { TensorVisualizer } from './visualizers/tensor-visualizer';

export class InteractiveTensor<Config> {
  constructor(private vis: TensorVisualizer<Config>) {
    // QuickSettings.useExtStyleSheet();
    const settings = QuickSettings.create(50, 50, 'Tensor');
    const anySettings = settings as any;
    anySettings._panel.style.width = 'auto';

    const canvas = this.vis.domElement;
    settings.addElement('', canvas);
  }

  setTensor(tensor: Tensor) {
    this.vis.setTensor(tensor);
  }
}
