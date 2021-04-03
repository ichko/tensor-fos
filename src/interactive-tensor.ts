import { Tensor } from '@tensorflow/tfjs-core';
import QuickSettings from 'quicksettings';
import { NDTensorHeatmapVisualizer } from './visualizers/heatmap';
import { debounce } from 'debounce';

type VisType = 'heatmap';

export class InteractiveTensor {
  private vis: NDTensorHeatmapVisualizer;

  constructor(shape: number[], type: VisType = 'heatmap') {
    // QuickSettings.useExtStyleSheet();
    const settings = QuickSettings.create(0, 0, 'Tensor');

    this.vis = new NDTensorHeatmapVisualizer({
      pixelSize: 2,
      tensorShape: shape,
      outerPadding: 2,
    });

    const canvas = this.vis.getHTMLElement();
    settings.addElement('', canvas);

    const onVal = (val: number) => {
      console.log(val);
      this.vis.setProps({ pixelSize: val });
      const width = canvas.getBoundingClientRect().width + 20;
      settings.setWidth(width);
    };

    onVal(1);

    settings.addRange('padding', 1, 5, 1, 1, onVal);
  }

  setTensor(tensor: Tensor) {
    this.vis.setTensor(tensor);
  }
}
