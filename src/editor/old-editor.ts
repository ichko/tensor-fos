import * as d3 from 'd3';

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
  private scale: number;

  constructor() {
    this.container = document.createElement('div');
    this.coordSystem = document.createElement('div');
    this.container.appendChild(this.coordSystem);

    const bgSize = 30;
    applyCSS(this.container, {
      width: '800px',
      height: '800px',
      border: '1px solid black',
      overflow: 'hidden',
      position: 'relative',
      backgroundImage: 'radial-gradient(#e3e3e3 1px, white 2px)',
      backgroundSize: `${bgSize}px ${bgSize}px`,
    });

    const d3CoordSystem = d3.select(this.coordSystem);
    const d3Container = d3.select(this.container);
    this.scale = 1;

    const zoomed = (e: any) => {
      const trans = e.transform;
      this.scale = trans.k;

      d3CoordSystem.style(
        'transform',
        `translate(${trans.x}px, ${trans.y}px) scale(${trans.k})`
      );
      d3Container
        .style('background-position', `${trans.x}px ${trans.y}px`)
        .style(
          'background-size',
          `${trans.k * bgSize}px ${trans.k * bgSize}px`
        );
    };

    const zoom = d3.zoom().scaleExtent([0.1, 10]).on('zoom', zoomed);

    d3Container.call(zoom as any);

    d3CoordSystem.style('transform-origin', '0 0');
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
      .style('top', (d: string, i: number) => `${-1 + i * 20}px`);

    var drag = d3
      .drag()
      .subject(d => d)
      .on('drag', dragged);

    d3.select(newNode.container).call(drag as any);

    const $this = this;
    function dragged(this: any, d: any) {
      console.log(d);
      const x = d.x / $this.scale;
      const y = d.y / $this.scale;
      d3.select(this).style('left', `${x}px`).style('top', `${y}px`);
    }
  }
}
