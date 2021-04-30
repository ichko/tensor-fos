import { Core, createBaklava } from 'baklavajs';
import { OptionPlugin } from '@baklavajs/plugin-options-vue';
import { ViewPlugin } from '@baklavajs/plugin-renderer-vue';
import Vue from 'vue';

const SomeOption = Vue.extend({
  props: ['name', 'node'],
  render(h) {
    return h(
      'button',
      {
        on: {
          click: () => {
            this.node.action(this.name);
          },
        },
      },
      this.name as string
    );
  },
});

export class BaklavaEditor {
  domElement: HTMLElement;

  constructor() {
    const option = Vue.component('MyOption', {
      data: function () {
        return {
          count: 0,
        };
      },
      template:
        '<button v-on:click="count++">You clicked me {{ count }} times.</button>',
    });

    const viewPlugin = new ViewPlugin();
    const optionsPlugin = new OptionPlugin();
    viewPlugin.registerOption('MyOption', SomeOption);
    viewPlugin.enableMinimap = true;

    console.log(option);

    this.domElement = document.createElement('div');
    this.domElement.style.width = '90%';
    this.domElement.style.height = '90%';
    this.domElement.style.margin = '0 auto';

    const editorDiv = document.createElement('div');
    this.domElement.appendChild(editorDiv);

    const plugin = createBaklava(editorDiv);
    const editor = plugin.editor;
    editor.use(optionsPlugin);
    editor.use(viewPlugin);

    const myNode = new Core.NodeBuilder('My Node')
      .addOption('Operation', 'SelectOption', 'Add', undefined, {
        items: ['Add', 'Subtract'],
      })
      .addOption('MyOptionLabel', 'MyOption')
      .build();

    editor.registerNodeType('My Node', myNode);

    const instance = new myNode();
    editor.addNode(instance);
  }
}
