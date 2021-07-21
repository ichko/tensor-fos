import { zip } from './../utils';
import { Tensor } from '@tensorflow/tfjs-core';
import { NodeEditor, nodeType, Port } from '.';
import * as ml from '../ml';
import { SmallMultiplesRenderer } from '../tensor-renderer/small-multiples';
import { TfJsVisRenderer } from '../tensor-renderer/tfjs-vis';
import * as tf from '@tensorflow/tfjs';
import { memo } from '../utils';
import { colors } from 'src/editor/to-generate';

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

export async function registerNodeTypes(editor: NodeEditor) {
  const tfjsNodeTypes = exportTfJsNodes();
  const generated = await getGeneratedNodeTypes();

  [...tfjsNodeTypes, ...generated].forEach(nodeType => {
    editor.registerNodeType(nodeType as any);
  });
}

async function getGeneratedNodeTypes() {
  const generatedDocs = require('../../dist/generated-type-docs.json');
  console.log('input >>', generatedDocs);

  const module = await require('src/editor/to-generate');

  function resolveType(type: any): any {
    console.log('T', type);

    switch (type.kindString) {
      case 'Project':
        return type.children.flatMap(resolveType).filter((c: any) => !!c);
      case 'Function':
        return zip(type.signatures, type.sources)
          .map(([sig, src]: [any, any]) => {
            sig.src = src;
            return sig;
          })
          .flatMap(resolveType);
      case 'Type literal':
        return type.children.map((c: any) => ({ name: c.name, type: 'json' }));
      case 'Property':
      case 'Parameter':
        if (type.name === '__namedParameters') {
          return resolveType(type.type.declaration);
        } else {
          if (['array'].includes(type.type.type)) {
            return [{ name: type.name, type: 'json' }];
          }
          return [type.name];
        }
      case 'Class':
        const [callMethod] = type.children.find(
          (c: any) => c.name === 'call'
        ).signatures;
        const instance = new module[type.name]();
        const ta = callMethod.type.typeArguments[0];
        const outs =
          ta.name === 'void'
            ? []
            : resolveType(ta.declaration).map((c: any) => c.name);

        return nodeType({
          id: type.name,
          ins: callMethod.parameters?.flatMap(resolveType),
          outs: outs,

          ctor: async () => {
            await instance.init?.();
            return {
              domElement: instance.domElement,
              compute: args => {
                return instance.call?.(args);
              },
            };
          },
          color: instance.color,
        });
      case 'Call signature':
        return nodeType({
          id: type.name,
          ins: type.parameters.flatMap(resolveType),
          outs: resolveType(type.type.declaration).map((c: any) => c.name),
          ctor: async () => {
            const handler = module[type.name];
            return {
              compute: args => {
                return handler(args);
              },
            };
          },
          color: colors.util,
        });
      default:
        console.warn('Unsupported type', type);
    }
  }

  const resolutions = resolveType(generatedDocs);

  console.log('resolution >>', resolutions);
  return resolutions;
}
