import { zip } from './../utils';
import { NodeEditor, nodeType } from '.';
import { colors } from 'src/editor/to-generate';
import { callUnwrap } from './utils';

export async function registerNodeTypes(editor: NodeEditor) {
  const generated = await getGeneratedNodeTypes();

  [...generated].forEach(nodeType => {
    editor.registerNodeType(nodeType as any);
  });
}

async function getGeneratedNodeTypes() {
  const generatedDocs = require('/dist/generated-type-docs.json');
  const module = await require('src/editor/to-generate');

  function resolveType(type: any): any {
    if (type.name.startsWith('$')) {
      console.info('skipping type:', type.name);
      return;
    }

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
          (c: any) => c.name === 'call' || c.name === 'lazy'
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
              compute:
                callMethod.name === 'call'
                  ? callUnwrap(args => instance.call(args))
                  : args => instance.lazy(args),
            };
          },
          color: instance.color,
        });
      case 'Call signature':
        return nodeType({
          id: type.name,
          ins: type.parameters.flatMap(resolveType),
          outs:
            type.type.name === 'Promise'
              ? []
              : resolveType(type.type.declaration).map((c: any) => c.name),
          ctor: async () => {
            const handler = module[type.name];
            return {
              compute: callUnwrap(args => {
                return handler(args);
              }),
            };
          },
          color: colors.util,
        });
      default:
        console.warn('Unsupported type', type);
    }
  }

  return resolveType(generatedDocs);
}
