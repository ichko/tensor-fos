const colormap = require('colormap')
const interpolate = require('color-interpolate');

type CMap = (factor: number) => string;

export function getCmap(name = 'jet'): CMap {
  const cmap = colormap({
    colormap: name,
    nshades: 10,
    format: 'hex',
    alpha: 1
  });

  return interpolate(cmap)
}
