import { Core, createBaklava } from 'baklavajs';
import Vue from 'vue';

const InjectableOption = Vue.component('InjectableOption', {
  props: ['option', 'node', 'value'],
  data: function () {
    return {};
  },
  mounted: function () {
    const container = this.$refs.container as HTMLElement;
    const injected = this.$props.option.element as () => HTMLElement;
    container.appendChild(injected());
  },
  template: '<div ref="container"></div>',
});

function injectCSS() {
  const css = `
    .node {
      max-width: none;
    }
  `;

  const style = document.createElement('style');
  style.innerText = css;
  document.body.appendChild(style);
}
export class BaklavaEditor {
  public domElement: HTMLElement;
  private editor: any;
  private customNodesMap: { [key: string]: any } = {};

  constructor() {
    injectCSS();

    this.domElement = document.createElement('div');
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';

    const editorDiv = document.createElement('div');
    this.domElement.appendChild(editorDiv);

    const plugin = createBaklava(editorDiv);
    this.editor = plugin.editor;

    plugin.registerOption('InjectableOption', InjectableOption);

    // const instance = new CustomNode();
    // instance.position.x = 10;
    // editor.addNode(instance);
  }

  registerNodeType({
    name,
    ins,
    outs,
    element,
  }: {
    name: string;
    ins: string[];
    outs: string[];
    element: () => HTMLElement;
  }) {
    const CustomNodeBuilder = new Core.NodeBuilder(name)
      .setName(name)
      .addOption('injected option', 'InjectableOption', undefined, undefined, {
        element,
      });

    ins.forEach(inPort => CustomNodeBuilder.addInputInterface(inPort));
    outs.forEach(outPort => CustomNodeBuilder.addOutputInterface(outPort));

    const CustomNode = CustomNodeBuilder.build();
    this.customNodesMap[name] = CustomNode;

    this.editor.registerNodeType(name, CustomNode);
  }

  addNode({
    name,
    pos = { x: 0, y: 0 },
    width = undefined,
  }: {
    name: string;
    pos?: { x: number; y: number };
    width?: number;
  }) {
    if (!this.customNodesMap[name]) {
      throw new Error(`Unknown node type ${name}`);
    }

    const ctor = this.customNodesMap[name];
    const instance = new ctor();
    this.editor.addNode(instance);

    instance.position = pos;
    if (width) {
      instance.width = width;
    } else {
      instance.width = 'auto';
    }
  }
}
