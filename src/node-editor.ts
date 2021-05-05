import { Core, createBaklava, PluginEngine } from 'baklavajs';
import { Engine } from '@baklavajs/plugin-engine';
import { OptionPlugin } from '@baklavajs/plugin-options-vue';
import Vue from 'vue';

interface Context<I, O> {
  domElement?: HTMLElement;
  compute?: (i: I) => Promise<O>;
}

interface NodeType<I, O> {
  id: string;
  ins?: (keyof I)[];
  outs?: (keyof O)[];
  ctor(): Promise<Context<I, O>>;
}

export function nodeType<I, O>(nodeType: NodeType<I, O>) {
  return nodeType;
}

const InjectableOption = Vue.component('InjectableOption', {
  props: ['option', 'node', 'value'],
  data: function () {
    return {};
  },
  mounted: function () {
    const container = this.$refs.container as HTMLElement;
    const injected = this.$props.option.element as HTMLElement;
    container.appendChild(injected);
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

export class NodeEditor {
  public domElement: HTMLElement;
  private editor: any;
  private customNodesMap: { [key: string]: () => Core.Node } = {};
  private engine: PluginEngine.Engine;

  constructor() {
    injectCSS();

    this.domElement = document.createElement('div');
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';

    const editorDiv = document.createElement('div');
    this.domElement.appendChild(editorDiv);

    const plugin = createBaklava(editorDiv);
    this.editor = plugin.editor;
    this.engine = new Engine(
      false /* whether to automatically calculate on changes */
    );
    this.editor.use(this.engine);
    this.editor.use(new OptionPlugin());

    plugin.registerOption('InjectableOption', InjectableOption);

    this.registerNodeType({
      id: 'Step',
      ctor: async () => {
        const button = document.createElement('button');
        button.innerText = 'Play';

        let play = false;
        button.onclick = () => {
          play = !play;
          button.innerText = play ? 'Pause' : 'Play';
        };

        setInterval(() => {
          if (play) {
            this.resolve();
          }
        }, 100);

        return { domElement: button };
      },
    });

    this.addNode({ id: 'Step', pos: { x: 20, y: 20 } });
  }

  registerNodeType<I, O>({ id, ins = [], outs = [], ctor }: NodeType<I, O>) {
    let BaklavaNodeBuilder = new Core.NodeBuilder(id).setName(id);

    ins.forEach(
      inPort =>
        (BaklavaNodeBuilder = BaklavaNodeBuilder.addInputInterface(
          inPort as string
        ))
    );
    outs.forEach(
      outPort =>
        (BaklavaNodeBuilder = BaklavaNodeBuilder.addOutputInterface(
          outPort as string
        ))
    );

    const decoratedCtor = () => {
      BaklavaNodeBuilder = BaklavaNodeBuilder.onCalculate(
        async (node, data) => {
          const values = await Promise.all(
            ins.map(i => node.getInterface(i as string).value)
          );

          const inMap: { [key: string]: string } = {};
          ins.forEach((inName, index) => {
            inMap[inName as string] = values[index];
          });

          const compute = await (node as any).$compute;
          if (!compute) return;

          const result = await compute(inMap);

          if (result) {
            Object.keys(result).forEach(key => {
              node.getInterface(key).value = result[key];
            });
          }

          return result;
        }
      );

      const baklavaNodeCtor = BaklavaNodeBuilder.build();
      const baklavaNodeInstance = new baklavaNodeCtor() as any;
      baklavaNodeInstance.$compute = new Promise(async resolve => {
        const { domElement, compute } = await ctor();
        if (domElement) {
          baklavaNodeInstance.addOption(
            'injected option',
            'InjectableOption',
            undefined,
            undefined,
            { element: domElement }
          );
        }

        resolve(compute);
      });

      baklavaNodeInstance.width = 'auto';

      return baklavaNodeInstance as Core.Node;
    };
    this.customNodesMap[id] = decoratedCtor;

    this.editor.registerNodeType(id, decoratedCtor);
  }

  async resolve() {
    this.engine.calculate();
  }

  addConnection(
    fromNode: Core.Node,
    toNode: Core.Node,
    fromInterface: string,
    toInterface: string
  ) {
    this.editor.addConnection(
      fromNode.getInterface(fromInterface),
      toNode.getInterface(toInterface)
    );
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
    const instance = ctor();
    this.editor.addNode(instance);

    instance.name = title || id;
    (instance as any).position = pos;

    return instance;
  }
}
