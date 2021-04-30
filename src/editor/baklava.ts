import { Core, createBaklava } from 'baklavajs';
import { OptionPlugin } from '@baklavajs/plugin-options-vue';

export class BaklavaEditor {
  domElement: HTMLElement;

  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.style.width = '90%';
    this.domElement.style.height = '90%';
    this.domElement.style.margin = '0 auto';

    const editorDiv = document.createElement('div');
    this.domElement.appendChild(editorDiv);

    const plugin = createBaklava(editorDiv);
    const editor = plugin.editor;
    editor.use(new OptionPlugin());

    const myNode = new Core.NodeBuilder('My Node')
      .addInputInterface('My Interface')
      .addOption('Operation', 'SelectOption', 'Add', undefined, {
        items: ['Add', 'Subtract'],
      })
      .addOption('Operation2', 'SelectOption', 'Add', undefined, {
        items: ['Add', 'Subtract'],
      })
      .addOutputInterface('test')
      .build();

    editor.registerNodeType('My Node', myNode);

    const instance = new myNode();
    editor.addNode(instance);
  }
}
