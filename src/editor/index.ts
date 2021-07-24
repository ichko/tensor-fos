import { Core, createBaklava, PluginEngine } from 'baklavajs';
import { Engine } from '@baklavajs/plugin-engine';
import { OptionPlugin } from '@baklavajs/plugin-options-vue';
import { InterfaceTypePlugin } from '@baklavajs/plugin-interface-types';
import Vue from 'vue';

interface Context<I, O> {
  domElement?: HTMLElement;
  compute?: (i: I) => Promise<O>;
}

export type PortType = 'any' | 'bool' | 'json' | 'int';

export interface Port<T> {
  name: keyof T;
  type: PortType;
  defaultValue?: any;
}

interface NodeType<I, O> {
  id: string;
  ins?: (keyof I | Port<I>)[];
  outs?: (keyof O)[];
  ctor(): Promise<Context<I, O>>;
  color?: string;
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
    .node-editor .background {
      background-color: #4c4c4c;
      background-image: linear-gradient(rgba(0,0,0,0.133333) 1px, transparent 1px),linear-gradient(90deg, rgba(0,0,0,0.133333) 1px, transparent 1px),linear-gradient(#444444 1px, transparent 1px),linear-gradient(90deg, #444444 1px, transparent 1px);
    }
    .node {
      max-width: none;
      border-radius: 0px;
      box-shadow: 0 0 0 3px #000;
      filter: none; // drop-shadow(0 0 3px rgba(0,0,0,0.9));
    }
    .node>.__title {
      border-radius: 0;
      background: rgba(0, 0, 0, 0.8);
      font-weight: bold;
      text-transform: uppercase;
    }
    .node:hover {
      box-shadow: 0 0 0 3px #fff;
    }
    .node.--selected {
      box-shadow: 0 0 0 4px cyan;
    }

    .dark-checkbox {
      align-items: center;
    }
    .dark-checkbox.--checked .__checkmark-container {
      background-color: #000000;
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

    const intfTypePlugin = new InterfaceTypePlugin();
    this.domElement = document.createElement('div');
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';

    const editorDiv = document.createElement('div');
    this.domElement.appendChild(editorDiv);

    const plugin = createBaklava(editorDiv);
    this.editor = plugin.editor;
    plugin.backgroundGrid.subGridVisibleThreshold = 0;
    plugin.backgroundGrid.gridSize = 30;
    plugin.backgroundGrid.gridDivision = 1;
    this.engine = new Engine(
      false /* whether to automatically calculate on changes */
    );
    this.editor.use(this.engine);
    this.editor.use(new OptionPlugin());
    this.editor.use(intfTypePlugin);

    plugin.registerOption('InjectableOption', InjectableOption);

    plugin.hooks.renderNode.tap(this, node => {
      const nodeEl = (node as any).$el as HTMLElement;
      const color = (node.data as any).$color;

      if (color) {
        nodeEl.style.background = color;
        nodeEl.style.color = 'black';
        nodeEl.style.fontWeight = 'bold';
      }

      return node;
    });

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

  registerNodeType<I, O>({
    id,
    ins = [],
    outs = [],
    ctor,
    color,
  }: NodeType<I, O>) {
    let BaklavaNodeBuilder = new Core.NodeBuilder(id).setName(id);
    const inNames = ins.map(i => (typeof i === 'object' ? i.name : i));
    const inObjects = ins.map(i =>
      typeof i === 'object'
        ? i
        : ({ name: i, type: 'any', defaultValue: undefined } as Port<any>)
    );

    inObjects.forEach(({ name, type, defaultValue }) => {
      const typeToOptionMap: Map<PortType, string | undefined> = new Map();
      typeToOptionMap.set('any', undefined);
      typeToOptionMap.set('bool', 'CheckboxOption');
      typeToOptionMap.set('json', 'InputOption');

      BaklavaNodeBuilder = BaklavaNodeBuilder.addInputInterface(
        name as string,
        typeToOptionMap.get(type),
        JSON.stringify(defaultValue),
        { type }
      );
    });

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
            inNames.map(i => {
              const interf = node.getInterface(i as string);
              if (interf.type === 'json') {
                try {
                  return JSON.parse(interf.value);
                } catch (e) {
                  return interf.value;
                }
              }

              return interf.value;
            })
          );

          const inMap: { [key: string]: string } = {};
          inNames.forEach((inName, index) => {
            inMap[inName as string] = values[index];
          });

          const compute = await (node as any).$compute;
          if (!compute) return;

          const unset = Symbol('unset');
          let result: any = unset;
          (outs as any[]).forEach(key => {
            node.getInterface(key).value = async () => {
              if (result === unset) {
                result = await compute(inMap);
              }

              return result[key];
            };
          });

          if (outs.length === 0) {
            await compute(inMap);
          }
        }
      );

      const baklavaNodeCtor = BaklavaNodeBuilder.build();

      const baklavaNodeInstance = new baklavaNodeCtor() as any;
      baklavaNodeInstance.$color = color;
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

  exportState(): object {
    return this.editor.save();
  }

  loadState(state: object) {
    this.editor.load(state);
  }
}
