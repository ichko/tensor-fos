import { Tensor } from '@tensorflow/tfjs-core';
import { NodeEditor, nodeType, Port } from '.';
import * as ml from '../ml';
import { SmallMultiplesRenderer } from '../tensor-renderer/small-multiples';
import { TfJsVisRenderer } from '../tensor-renderer/tfjs-vis';
import * as tf from '@tensorflow/tfjs';
import { memo } from '../utils';

// import { ContainerReflection } from 'typedoc';
// import { Type } from 'typedoc/dist/lib/models';

const colors = {
  model: '#fb3079',
  visual: 'white',
  dataSrc: '#16ff85',
  util: '#ffb316',
};

const common = [
  nodeType({
    id: 'Reshape',
    ins: ['inTensor', { name: 'shape', type: 'json' }],
    outs: ['outTensor'],
    ctor: async () => {
      return {
        compute: async ({
          inTensor,
          shape,
        }: {
          inTensor: Tensor;
          shape: number[];
        }) => {
          return { outTensor: inTensor.reshape(shape) };
        },
      };
    },
    color: colors.util,
  }),

  nodeType({
    id: 'Mnist',
    outs: ['nextBatch', 'exampleBatch'],
    ctor: async () => {
      const mnist = ml.data.loadMnist();
      const trainDataset = await mnist({ bs: 16 }).iterator();
      const exampleBatch = (await trainDataset.next()).value;

      return {
        compute: async () => {
          return {
            nextBatch: (await trainDataset.next()).value,
            exampleBatch,
          };
        },
      };
    },
    color: colors.dataSrc,
  }),

  nodeType({
    id: 'Select Batch Input',
    ins: ['batch'],
    outs: ['batch.x'],
    ctor: async () => {
      return {
        compute: async ({ batch }: { batch: any }) => ({
          'batch.x': batch.x,
        }),
      };
    },
    color: colors.util,
  }),

  nodeType({
    id: 'MnistClassifier',
    ins: ['optimBatch', 'forwardBatch'],
    outs: ['preds', 'optimStep'],
    ctor: async () => {
      const model = new ml.MnistClassifier.Model();
      model.net.summary();

      return {
        compute: async ({
          forwardBatch,
          optimBatch,
        }: {
          forwardBatch: ml.MnistClassifier.Batch;
          optimBatch: ml.MnistClassifier.Batch;
        }) => {
          return {
            preds: model.forward(forwardBatch.x),
            optimStep: model.optimStep(optimBatch),
          };
        },
      };
    },
    color: colors.model,
  }),

  nodeType({
    id: 'Heatmap',
    ins: ['tensor'],
    ctor: async () => {
      const batchViewRenderer = new SmallMultiplesRenderer(
        {
          nDimsEntity: 2,
          dimDirections: ['horizontal', 'vertical', 'horizontal', 'vertical'],
        },
        () => new TfJsVisRenderer({ type: 'heatmap' })
      );

      return {
        domElement: batchViewRenderer.domElement,
        compute: async ({ tensor }: { tensor: Tensor }) => {
          batchViewRenderer.setTensor(tensor);
        },
      };
    },
    color: colors.visual,
  }),

  nodeType({
    id: 'Barchart',
    ins: ['tensor'],
    ctor: async () => {
      const predViewRenderer = new SmallMultiplesRenderer(
        {
          nDimsEntity: 1,
          dimDirections: ['horizontal', 'vertical', 'horizontal'],
        },
        () => new TfJsVisRenderer({ type: 'barchart' })
      );

      return {
        domElement: predViewRenderer.domElement,
        compute: async ({ tensor }: { tensor: Tensor }) => {
          predViewRenderer.setTensor(tensor);
        },
      };
    },
    color: colors.visual,
  }),

  nodeType({
    id: 'JSON.parse',
    outs: ['value'],
    ctor: async () => {
      const element = document.createElement('input');
      element.value = '[16, 28, 28]';

      return {
        domElement: element,
        compute: async () => ({ value: JSON.parse(element.value) }),
      };
    },
    color: colors.util,
  }),
];

interface NodeDef {
  func: any;
  args?: Port<any>[];
}

function exportTfJsNodes() {
  const objectInputArgDefs: NodeDef[] = [
    {
      func: tf.layers.dense,
      args: [{ name: 'units', type: 'int', defaultValue: 10 }],
    },
    {
      func: tf.layers.flatten,
      args: [],
    },
    {
      func: tf.layers.embedding,
      args: [
        { name: 'inputDim', type: 'int', defaultValue: 10 },
        { name: 'outputDim', type: 'int', defaultValue: 10 },
      ],
    },
  ];
  const sequentialInputArgsDefs: NodeDef[] = [
    {
      func: tf.rand,
      args: [{ name: 'shape', type: 'json', defaultValue: [3, 5, 5] }],
    },
    {
      func: tf.randomNormal,
      args: [{ name: 'shape', type: 'json', defaultValue: [3, 5, 5] }],
    },
    {
      func: tf.randomUniform,
      args: [{ name: 'shape', type: 'json', defaultValue: [3, 5, 5] }],
    },
  ];

  const objectInputArgNodes = objectInputArgDefs.map(def =>
    nodeType({
      color: colors.model,
      id: `tf.layers.${def.func.name}`,
      ins: def.args?.map(arg => ({ name: arg.name as string, type: arg.type })),
      outs: ['layer'],
      ctor: async () => {
        return {
          compute: memo(async (args: any) => {
            const layer = def.func(args);
            return { layer };
          }),
        };
      },
    })
  );

  const sequentialInputArgsNodes = sequentialInputArgsDefs.map(def =>
    nodeType({
      color: colors.util,
      id: `tf.${def.func.name}`,
      ins: def.args?.map(arg => ({ name: arg.name as string, type: arg.type })),
      outs: ['tensor'],
      ctor: async () => {
        return {
          compute: async (args: any) => {
            const tensor = def.func(...Object.values(args));
            return { tensor };
          },
        };
      },
    })
  );

  return [...objectInputArgNodes, ...sequentialInputArgsNodes];
}

export function registerNodeTypes(editor: NodeEditor) {
  const tfjsNodeTypes = exportTfJsNodes();
  const generated = getGeneratedNodeTypes();

  [...common, ...tfjsNodeTypes].forEach(nodeType => {
    editor.registerNodeType(nodeType as any);
  });
}

function getGeneratedNodeTypes() {
  const generatedDocs = require('../../dist/generated-type-docs.json') as any;

  const functions: any[] = [];

  function resolveType(type: any) {
    return type;
  }

  generatedDocs.children?.forEach((node: any) => {
    if (node.kindString === 'Function') {
      node.signatures?.forEach((signatureNode: any) => {
        const name = signatureNode.name;
        const args = signatureNode.parameters?.map(({ name, type }: any) => ({
          name,
          type: resolveType(type),
        }));

        functions.push({ name, args });
      });
    }
  });

  console.log(functions);
}
