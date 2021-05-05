import * as tf from '@tensorflow/tfjs';

const colormap = require('colormap');
const interpolate = require('color-interpolate');

type CMap = (factor: number) => string;

export function getCmap(name = 'jet'): CMap {
  const cmap = colormap({
    colormap: name,
    nshades: 10,
    format: 'hex',
    alpha: 1,
  });

  return interpolate(cmap);
}

export const viridis = getCmap('viridis');

export const zip = <A, B>(a: A[], b: B[]): [A, B][] =>
  a.map((a, i) => [a, b[i]]);

export const range = (n: number) => Array.from(Array(n).keys());

export const minMaxNormalize = (tensor: tf.Tensor): tf.Tensor => {
  const [min, max] = [tensor.min(), tensor.max()];
  const dist = max.sub(min);

  return tensor.sub(min).div(dist);
};

// SRC - <https://stackoverflow.com/a/16436975/10082319>
export const arraysEqual = (a: any[], b: any[]): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};

// SRC - https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// SRC - https://michilehr.de/overwrite-cmds-and-ctrls-in-javascript
export function onCtlS(handler: () => void) {
  document.addEventListener(
    'keydown',
    function (e) {
      if (
        (window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey) &&
        e.keyCode == 83
      ) {
        e.preventDefault();
        handler();
      }
    },
    false
  );
}
export class Persistance {
  set(key: string, value: object) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  get<T>(key: string): T | undefined {
    const value = window.localStorage.getItem(key);
    if (!value) return undefined;
    return JSON.parse(value) as T;
  }
}

export function memo(func: (...args: any) => any) {
  const memo: { [key: string]: any } = {};
  return function (this: any) {
    const args = Array.from(arguments);
    const key = JSON.stringify(args);
    if (memo[key] === undefined) {
      memo[key] = func.apply(this, args);
    }

    return memo[key];
  };
}
