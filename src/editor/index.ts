import { Core, createBaklava, PluginEngine } from 'baklavajs';
import { Engine } from '@baklavajs/plugin-engine';
import { OptionPlugin } from '@baklavajs/plugin-options-vue';
import { InterfaceTypePlugin } from '@baklavajs/plugin-interface-types';
import Vue from 'vue';

interface Context {
  domElement?: HTMLElement;
  compute?: (i: any) => any;
}

interface NodeType {
  id: string;
  ins: { name: string; type: string }[];
  outs: string[];
  ctor(): Promise<Context>;
  color: string;
}

export function nodeType(nodeType: NodeType) {
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
      background-color: #000;
      background-image:
        linear-gradient(rgba(0,0,0,0.133333) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.133333) 1px, transparent 1px),
        linear-gradient(#222 1px, transparent 1px),
        linear-gradient(90deg, #222 1px, transparent 1px);
    }
    .node {
      max-width: none;
      border-radius: 0px;
      box-shadow: 0 0 0 5px #666;
      filter: none; // drop-shadow(0 0 3px rgba(0,0,0,0.9));
    }
    .node>.__title {
      border-radius: 0;
      padding: 8px;
      background: #333;
      font-weight: bold;
      text-transform: uppercase;
    }
    .node:hover {
      box-shadow: 0 0 0 5px #999;
    }
    .node.--selected {
      box-shadow: 0 0 0 6px #ffe80c;
    }

    .dark-checkbox {
      align-items: center;
    }
    .dark-checkbox.--checked .__checkmark-container {
      background-color: #000000;
    }
    .node-interface .__port {
      width: 10px;
      height: 10px;
      box-shadow: 0 0 0 4px #666;
    }
    .node-interface.--output .__port {
      right: -18px;
      top: 5px;
      box-shadow: 0 0 0 4px #666;
    }
    .node-interface.--input .__port {
      left: -18px;
      top: 5px;
    }
    .connection {
      stroke: #666;
      stroke-width: 3px;
    }
  `;

  const style = document.createElement('style');
  style.innerText = css;
  document.body.appendChild(style);
}

function memoizeLastsInput(func: (i: any) => any | undefined) {
  let memory: any = {};
  const unset = Symbol('unset');
  let output: any = unset;

  return function (input: any) {
    if (typeof input !== 'object') {
      if (input !== memory) {
        memory = input;
        output = func(input);
      }

      return output;
    }

    let inputSame = true;
    for (let name in input) {
      if (memory[name] !== input[name]) {
        inputSame = false;
      }
      memory[name] = input[name];
    }

    const numArgs = Object.keys(input).length;
    if (!inputSame || output === unset || numArgs == 0) {
      output = func(input);
    }

    return output;
  };
}

export class NodeEditor {
  public domElement: HTMLElement;
  private editor: any;
  private engine: PluginEngine.Engine;

  constructor() {
    injectCSS();

    const interfaceTypePlugin = new InterfaceTypePlugin();
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
    this.editor.use(interfaceTypePlugin);

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
  }

  registerNodeType({ id, ins = [], outs = [], ctor, color }: NodeType) {
    const baklavaNodeBuilder = new Core.NodeBuilder(id).setName(id);
    const inNames = ins.map(i => i.name);

    ins.forEach(({ name, type }) => {
      const typeToOptionMap = {
        any: undefined,
        bool: 'CheckboxOption',
        json: 'InputOption',
      } as any;

      baklavaNodeBuilder.addInputInterface(
        name as string,
        typeToOptionMap[type],
        undefined, // JSON.stringify(defaultValue),
        { type }
      );
    });

    outs.forEach(outPort =>
      baklavaNodeBuilder.addOutputInterface(outPort as string)
    );

    const decoratedCtor = () => {
      const jsonMemory = memoizeLastsInput(x => JSON.parse(x));

      baklavaNodeBuilder.onCalculate(async (node: any, data) => {
        const inMap: { [key: string]: string } = {};
        const inValues = await Promise.all(
          inNames.map(async key => {
            const inter = await node.getInterface(key);
            const value = await inter.value;
            if (inter.type === 'json') {
              try {
                return jsonMemory(value);
              } catch (e) {}
            }

            return value;
          })
        );

        inNames.forEach((name, i) => (inMap[name] = inValues[i]));

        const compute = await node.$computePromise;
        const result = await compute?.(inMap);

        (outs as any[]).forEach(key => {
          node.getInterface(key).value = result[key];
        });
      });

      const baklavaNodeCtor = baklavaNodeBuilder.build();
      const baklavaNodeCtorInstance = new baklavaNodeCtor() as any;

      baklavaNodeCtorInstance.$color = color;
      baklavaNodeCtorInstance.$computePromise = new Promise(async resolve => {
        let { domElement, compute } = await ctor();
        if (domElement) {
          baklavaNodeCtorInstance.addOption(
            'injected option',
            'InjectableOption',
            undefined,
            undefined,
            { element: domElement }
          );
        }

        resolve(compute ? memoizeLastsInput(compute) : compute);
      });

      baklavaNodeCtorInstance.width = 'auto';

      return baklavaNodeCtorInstance as Core.Node;
    };

    this.editor.registerNodeType(id, decoratedCtor);
  }

  async resolve() {
    this.engine.calculate();
  }

  exportState(): object {
    return this.editor.save();
  }

  loadState(state: object) {
    this.editor.load(state);
  }
}
