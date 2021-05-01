import { Core, createBaklava } from 'baklavajs';
import Vue from 'vue';


const el = document.createElement('div');
el.innerHTML = 'i am the div';

const MyOption = Vue.component('MyOption', {
  props: ["option", "node", "value"],
  data: function () {
    return {
      count: 0,
      dom: el
    };
  },
  created: function() {
    console.log(this.$refs)
  },
  template:
    '<button v-on:click="count++">You clicked me {{ count }} times. (dom: {{ dom }} )</button>',
});

export class BaklavaEditor {
  public domElement: HTMLElement;

  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.style.width = '90%';
    this.domElement.style.height = '90%';
    this.domElement.style.margin = '0 auto';

    const editorDiv = document.createElement('div');
    this.domElement.appendChild(editorDiv);

    const plugin = createBaklava(editorDiv);
    const editor = plugin.editor;

    plugin.registerOption('MyOption', MyOption);

    const myNode = new Core.NodeBuilder('My Node')
      .setName("ButtonNode")
      .addOption("My Option", 'MyOption')
      .addOutputInterface("Test")
      .build();

    editor.registerNodeType('My Node name', myNode);

    const instance = new myNode();
    editor.addNode(instance);
  }
}
