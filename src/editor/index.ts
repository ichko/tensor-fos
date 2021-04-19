import { editorInstance } from './flume';

export class Editor {
  public domElement: HTMLElement;

  constructor() {
    const instance = editorInstance();
    this.domElement = instance.dom;
    console.log(instance.ref.getNodes());
  }
}
