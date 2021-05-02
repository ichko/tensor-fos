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
    id,
    ins,
    outs,
    element,
  }: {
    id: string;
    ins: string[];
    outs: string[];
    element: () => HTMLElement;
  }) {
    const CustomNodeBuilder = new Core.NodeBuilder(id)
      .setName(id)
      .addOption('injected option', 'InjectableOption', undefined, undefined, {
        element,
      });

    ins.forEach(inPort => CustomNodeBuilder.addInputInterface(inPort));
    outs.forEach(outPort => CustomNodeBuilder.addOutputInterface(outPort));

    const CustomNode = CustomNodeBuilder.build();
    const decoratedCtor = () => {
      const instance = new CustomNode() as any;
      instance.width = 'auto';
      return instance;
    };
    this.customNodesMap[id] = decoratedCtor;

    this.editor.registerNodeType(id, decoratedCtor);
  }

  addNode({
    id,
    title = undefined,
    pos = { x: 0, y: 0 },
    width = undefined,
  }: {
    id: string;
    title?: string;
    pos?: { x: number; y: number };
    width?: number;
  }) {
    if (!this.customNodesMap[id]) {
      throw new Error(`Unknown node type ${id}`);
    }

    const ctor = this.customNodesMap[id];
    const instance = new ctor();
    this.editor.addNode(instance);

    instance.name = title || id;
    instance.position = pos;
  }
}
