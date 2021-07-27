export class Element {
  element: HTMLElement;

  get domElement() {
    return this.element;
  }

  constructor(element: HTMLElement) {
    this.element = element;
  }

  select(selector: string) {
    return new Element(this.element.querySelector(selector)!);
  }

  get raw() {
    return this.element;
  }

  on<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) {
    this.element.addEventListener(type, listener, options);
  }
}

export function html(src: string) {
  const container = document.createElement('div');
  container.innerHTML = src;
  return new Element(container);
}
