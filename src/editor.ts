import * as d3 from 'd3';
import { renderer } from 'zoom-pan/src/renderer';

function ondrag(
  elem: HTMLElement,
  handler: (e: { dx: number; dy: number; x: number; y: number }) => void
) {
  // SRC - <https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_draggable>
  let dx = 0,
    dy = 0,
    startX = 0,
    startY = 0;
  elem.onmousedown = dragMouseDown;

  function dragMouseDown(e: MouseEvent) {
    if (e.target != elem) {
      e.preventDefault();
      return;
    }
    e = e || window.event;
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: any) {
    e = e || window.event;
    e.preventDefault();
    dx = startX - e.clientX;
    dy = startY - e.clientY;
    startX = e.clientX;
    startY = e.clientY;

    handler({ dx, dy, x: e.clientX, y: e.clientY });
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function applyCSS(element: HTMLElement, style: Partial<CSSStyleDeclaration>) {
  for (let name in style) {
    (element.style as any)[name] = style[name];
  }
}

class Node {
  container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');

    applyCSS(this.container, {
      border: '1px solid black',
      padding: '10px',
      position: 'absolute',
      boxSizing: 'border-box',
    });
  }
}

export class Editor {
  public container: HTMLDivElement;
  private nodes: Node[] = [];
  private coordSystem: HTMLDivElement;
  scale: number;

  constructor() {
    this.container = document.createElement('div');
    this.coordSystem = document.createElement('div');
    this.container.appendChild(this.coordSystem);

    applyCSS(this.container, {
      width: '800px',
      height: '800px',
      border: '1px solid black',
      overflow: 'hidden',
      position: 'relative',
      backgroundImage: 'radial-gradient(#ccc 1px, white 1px)',
      backgroundSize: '20px 20px',
    });

    const instance = renderer({
      minScale: 0.1,
      maxScale: 30,
      element: this.coordSystem,
      scaleSensitivity: 10,
    });

    this.scale = 1;

    const setBackground = () => {
      const transform = this.coordSystem.style.transform;
      const val1 = transform.split('(')[1];
      const val2 = val1.slice(0, val1.length - 1);
      const [s, _z1, _z2, _s, x, y] = val2.split(', ').map(v => +v);
      this.scale = s;

      applyCSS(this.container, {
        backgroundPosition: `${x}px ${y}px`,
        backgroundSize: `${s * 20}px ${s * 20}px`,
      });
    };

    ondrag(this.container, ({ dx, dy, x, y }) => {
      instance.panBy({
        originX: -dx,
        originY: -dy,
      });
      setBackground();
    });

    this.container.onwheel = (e: WheelEvent) => {
      instance.zoom({
        deltaScale: Math.sign(e.deltaY) > 0 ? -1 : 1,
        x: e.pageX,
        y: e.pageY,
      });
      setBackground();
    };
  }

  addNode(content: string | HTMLElement, inputs: string[] = []) {
    const newNode = new Node();

    this.nodes.push(newNode);
    this.coordSystem.appendChild(newNode.container);

    if (content instanceof HTMLElement) {
      newNode.container.appendChild(content);
    } else {
      newNode.container.innerText = content;
    }

    ondrag(newNode.container, ({ x, y }) => {
      newNode.container.style.top = `${x}px`;
      newNode.container.style.left = `${y}px`;
      console.log(newNode.container.style.top);
    });

    const inps = d3.select(newNode.container).selectAll('div');

    inps
      .data(inputs)
      .enter()
      .append('div')
      .classed('input', true)
      .style('width', '16px')
      .style('height', '16px')
      .style('background', 'red')
      .style('position', 'absolute')
      .style('left', '-8px')
      .style('top', (d: string, i: number) => `${-1 + i * 20}px`)
      // .text('test')
      .on('drag', e => {
        console.log(e);
      });
  }
}
